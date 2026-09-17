"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { trackedCases, escalationLetters } from "@/lib/db/schema";
import { decryptField } from "@/lib/db/crypto";
import { getSubscriptionTier } from "@/lib/billing/tier";
import { getMailingAddress, saveMailingAddress, type MailingAddress } from "@/lib/congress/mailing-address";
import { resolveCongressionalDistrict, GeocoderError } from "@/lib/congress/geocode";
import { findRepresentatives, hasStateCoverage, type RepresentativeEntry } from "@/lib/congress/representatives";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { draftEscalationLetter, type LetterType } from "@/lib/ai/escalation-letter";

const AddressInput = z.object({
  fullName: z.string().trim().min(1).max(200),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().length(2),
  zip: z.string().trim().min(5).max(10),
});

async function requirePlusUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in required.");
  }
  const tier = await getSubscriptionTier(session.user.id);
  if (tier !== "plus") {
    throw new Error("This is a CaseWhy Plus feature.");
  }
  return session.user;
}

export async function saveMyMailingAddress(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await requirePlusUser();
  const parsed = AddressInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in every field with a valid US address." };
  }
  await saveMailingAddress(user.id, parsed.data as MailingAddress);
  return { ok: true };
}

export async function getMySavedAddress(): Promise<MailingAddress | null> {
  const user = await requirePlusUser();
  return getMailingAddress(user.id);
}

export interface RepresentativesResult {
  address: MailingAddress;
  matchedAddress: string;
  representatives: RepresentativeEntry[];
  /** True when the district resolved but this pilot dataset has no entries for that state at all. */
  stateNotCovered: boolean;
}

export async function getMyRepresentatives(): Promise<
  { ok: true; result: RepresentativesResult } | { ok: false; error: string }
> {
  const user = await requirePlusUser();
  const address = await getMailingAddress(user.id);
  if (!address) {
    return { ok: false, error: "Save your mailing address first." };
  }

  let district;
  try {
    district = await resolveCongressionalDistrict(address);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof GeocoderError
          ? "Couldn't verify that address with the Census Bureau's lookup service. Please try again shortly."
          : "Something went wrong looking up your district.",
    };
  }
  if (!district) {
    return { ok: false, error: "That address couldn't be matched to a congressional district. Double-check it and try again." };
  }

  const representatives = findRepresentatives(district.state, district.district);
  return {
    ok: true,
    result: {
      address,
      matchedAddress: district.matchedAddress,
      representatives,
      stateNotCovered: !hasStateCoverage(district.state),
    },
  };
}

const DraftLetterInput = z.object({
  trackedCaseId: z.string().min(1),
  letterType: z.enum(["congressional", "field_office", "ombudsman"]),
  // Round 110 follow-up — was max(1000) (~170 words); Peter hit this
  // writing a real, one-page explanation and the old generic error gave
  // no indication why. 1000 was arbitrary rather than sized against real
  // usage -- 4000 (~650-700 words) comfortably covers a full page of
  // reason text while still bounding the AI prompt.
  userReason: z.string().trim().min(1).max(4000),
  /** Round 110 follow-up — Peter's own report: the reps list had no way
   * to pick which one a congressional letter goes to. An index into
   * findRepresentatives()'s own return order, not client-supplied
   * representative data -- that function is pure over static data, so
   * re-deriving the list server-side and indexing into it (below) can't
   * be used to inject an arbitrary "representative" into an AI-drafted
   * official letter. */
  representativeIndex: z.number().int().min(0).optional(),
});

export async function draftMyEscalationLetter(
  input: unknown
): Promise<{ ok: true; letterText: string } | { ok: false; error: string }> {
  const user = await requirePlusUser();
  const parsed = DraftLetterInput.safeParse(input);
  if (!parsed.success) {
    // Round 110 follow-up — was a bare "Missing or invalid input.", not
    // diagnosable when Peter hit it live and this session couldn't
    // reproduce it. Names the real field and reason now.
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Missing or invalid input: ${issue.path.join(".") || "input"} — ${issue.message}` };
  }
  const { trackedCaseId, letterType, userReason, representativeIndex } = parsed.data;

  const db = getDb();
  const [row] = await db
    .select()
    .from(trackedCases)
    .where(and(eq(trackedCases.id, trackedCaseId), eq(trackedCases.userId, user.id)));
  if (!row) {
    return { ok: false, error: "Case not found." };
  }

  const address = await getMailingAddress(user.id);
  if (!address) {
    return { ok: false, error: "Save your mailing address first." };
  }

  let representative: RepresentativeEntry | undefined;
  if (letterType === "congressional") {
    const district = await resolveCongressionalDistrict(address).catch(() => null);
    if (district) {
      const candidates = findRepresentatives(district.state, district.district);
      representative =
        representativeIndex !== undefined ? candidates[representativeIndex] : candidates.find((r) => r.chamber === "house" || r.chamber === "senate");
    }
  }

  let status;
  try {
    const receiptNumber = decryptField(row.receiptNumber);
    status = await getCaseStatus(receiptNumber);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof UscisApiError
          ? "Couldn't reach USCIS's case status service right now. Please try again shortly."
          : "Something went wrong looking up this case.",
    };
  }

  let letterText: string;
  try {
    letterText = await draftEscalationLetter({
      letterType: letterType as LetterType,
      status,
      userReason,
      address,
      representative,
    });
  } catch {
    return { ok: false, error: "The drafting assistant is temporarily unavailable. Please try again shortly." };
  }

  await db.insert(escalationLetters).values({
    trackedCaseId,
    userId: user.id,
    letterType,
  });

  return { ok: true, letterText };
}
