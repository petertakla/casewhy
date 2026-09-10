// Round 41 — shared "report incorrect information" submission logic, used
// by the "use server" wrapper in src/app/actions.ts across all three live
// Get Help entity types (and every future one, per
// partner-marketing-domain-concept.md's standing template). Mirrors
// src/lib/marketing/subscribe.ts and each entity type's own apply.ts:
// zod validation, a CSS-hidden honeypot, insert-then-best-effort-notify.
//
// No sign-in required and no admin dashboard exists yet at this volume —
// same "email is enough for now" call already made for join-form
// applications (round 28/29/34). A report never changes a live listing on
// its own; Peter reviews and decides, same as a new application.

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { listingReports } from "@/lib/db/schema";
import { sendListingReportNotification } from "@/lib/email/postmark";

export const REPORTABLE_ENTITY_TYPES = [
  "attorney",
  "accredited_representative",
  "legal_aid",
  "dso",
  "community_org",
  "pro_bono_representation",
] as const;
export type ReportableEntityType = (typeof REPORTABLE_ENTITY_TYPES)[number];

const ReportInput = z.object({
  entityType: z.enum(REPORTABLE_ENTITY_TYPES),
  entityId: z.string().trim().min(1),
  entityName: z.string().trim().min(1).max(300),
  reportText: z.string().trim().min(1, "Tell us what's wrong.").max(1000),
  reporterEmail: z.string().trim().toLowerCase().email("Enter a valid email address.").optional().or(z.literal("")),
  // Honeypot — see src/lib/marketing/subscribe.ts for the same pattern.
  website: z.string().max(0).optional().or(z.literal("")),
});

export interface ReportResult {
  ok: boolean;
  error?: string;
}

export async function submitListingReport(input: {
  entityType: string;
  entityId: string;
  entityName: string;
  reportText: string;
  reporterEmail?: string;
  website?: string;
}): Promise<ReportResult> {
  const parsed = ReportInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (parsed.data.website) {
    // Honeypot tripped — report success without writing anything.
    return { ok: true };
  }

  const db = getDb();
  await db.insert(listingReports).values({
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    entityName: parsed.data.entityName,
    reportText: parsed.data.reportText,
    reporterEmail: parsed.data.reporterEmail || null,
  });

  // Best-effort — a Postmark hiccup shouldn't fail a report that already
  // landed in the DB, same reasoning as every join-application notification.
  try {
    await sendListingReportNotification({
      entityType: parsed.data.entityType,
      entityName: parsed.data.entityName,
      reportText: parsed.data.reportText,
      reporterEmail: parsed.data.reporterEmail,
    });
  } catch (err) {
    console.error("Failed to send listing-report notification email", err);
  }

  return { ok: true };
}
