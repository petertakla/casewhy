"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { getSubscriptionTier, getSubscriptionDetails, TIER_LIMITS, PLUS_HARD_CEILING_MAX_CASES } from "@/lib/billing/tier";
import { UscisApiError } from "@/lib/uscis/client";
import { checkTrackedCaseNow } from "@/lib/uscis/check-status";
import { CASE_TYPES } from "@/lib/kb/case-type-timeline";
import { subscriptions } from "@/lib/db/schema";
import { sendCaseReviewRequestNotification } from "@/lib/email/postmark";

export interface TrackedCase {
  id: string;
  receiptNumber: string;
  lastCheckedAt: Date | null;
  /** One of CASE_TYPES' ids, or null for a case tracked before round 21. */
  caseType: string | null;
  /** Round 46 — "pending_review" cases are never polled and never counted
   * toward AI/chat quota until an admin approves the account past Plus's
   * 10-case auto-approved band. Always "active" on free-tier accounts. */
  status: "active" | "pending_review";
}

export async function getTrackedCases(userId: string): Promise<TrackedCase[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: trackedCases.id,
      receiptNumber: trackedCases.receiptNumber,
      lastCheckedAt: trackedCases.lastCheckedAt,
      caseType: trackedCases.caseType,
      status: trackedCases.status,
    })
    .from(trackedCases)
    .where(eq(trackedCases.userId, userId))
    .orderBy(trackedCases.createdAt);

  const result: TrackedCase[] = [];
  for (const row of rows) {
    try {
      result.push({
        id: row.id,
        receiptNumber: decryptField(row.receiptNumber),
        lastCheckedAt: row.lastCheckedAt,
        caseType: row.caseType,
        status: row.status === "pending_review" ? "pending_review" : "active",
      });
    } catch {
      // Malformed/undecryptable row (e.g. pre-encryption test data) — skip
      // rather than crash the dashboard.
    }
  }
  return result;
}

/**
 * CW-37 — on-demand status check, gated to CaseWhy Plus (free stays on the
 * once-daily cron). Reuses the exact same fetch/notify/update logic the
 * cron job runs per-row, just for one case, right now.
 */
export async function checkCaseNow(trackedCaseId: string): Promise<{ statusText: string }> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in required.");
  }

  const tier = await getSubscriptionTier(session.user.id);
  if (tier !== "plus") {
    throw new Error("On-demand status checks are a CaseWhy Plus feature.");
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(trackedCases)
    .where(and(eq(trackedCases.id, trackedCaseId), eq(trackedCases.userId, session.user.id)));
  if (!row) {
    throw new Error("Case not found.");
  }
  if (row.status === "pending_review") {
    throw new Error("This case is pending review and can't be checked yet.");
  }

  let result;
  try {
    result = await checkTrackedCaseNow(row);
  } catch (err) {
    throw new Error(
      err instanceof UscisApiError
        ? "Couldn't reach USCIS right now. Please try again shortly."
        : "Something went wrong checking this case."
    );
  }

  revalidatePath("/dashboard");
  return { statusText: result.status.statusText };
}

/**
 * Track a case, subject to the account's plan cap (CW-36: free = 1, plus =
 * 5 — see src/lib/billing/tier.ts). Each tracked case is now its own row
 * (CW-36 removed the old one-row-per-account constraint) — adding a case
 * no longer replaces an existing one; call untrackCase() first if the cap
 * is already reached.
 */
export async function trackCase(receiptNumber: string, caseType: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in to track a case.");
  }

  // Round 21 — required going forward, "other" included, so every new
  // tracked case has a real value to key explanation/chat/guardrail logic
  // off. Validated server-side, never trusted from the client alone.
  if (!CASE_TYPES.some((c) => c.id === caseType)) {
    throw new Error("Select a valid case type.");
  }

  const existing = await getTrackedCases(session.user.id);
  if (existing.some((c) => c.receiptNumber === receiptNumber)) {
    return; // already tracking this exact case
  }

  const tier = await getSubscriptionTier(session.user.id);
  const db = getDb();

  // Round 46 — Plus is gated-unlimited (three bands), not a flat cap; free
  // tier keeps its own simple cap, no review bands at all.
  if (tier === "plus") {
    const details = await getSubscriptionDetails(session.user.id);
    const totalCount = existing.length; // active + pending_review together
    if (totalCount >= PLUS_HARD_CEILING_MAX_CASES) {
      throw new Error(
        `You're tracking the maximum of ${PLUS_HARD_CEILING_MAX_CASES} cases CaseWhy Plus supports. Need to track more? Contact us at hello@casewhy.com.`
      );
    }

    const willBePending = totalCount >= details.effectiveMaxCases;
    const pendingAlreadyExists = existing.some((c) => c.status === "pending_review");

    await db.insert(trackedCases).values({
      userId: session.user.id,
      receiptNumber: encryptField(receiptNumber),
      email: encryptField(session.user.email),
      caseType,
      status: willBePending ? "pending_review" : "active",
    });

    // Notify once per threshold-crossing, not once per case — only when
    // this insert is the *first* pending_review row since the last
    // approval (i.e. no pending case existed yet before this one).
    if (willBePending && !pendingAlreadyExists) {
      const token = crypto.randomUUID();
      await db
        .update(subscriptions)
        .set({ pendingApprovalToken: token })
        .where(eq(subscriptions.userId, session.user.id));
      try {
        await sendCaseReviewRequestNotification({
          userEmail: session.user.email,
          approveUrl: `https://app.casewhy.com/api/admin/approve-cases?token=${token}`,
        });
      } catch (err) {
        console.error("Failed to send case-review-request notification email", err);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/ask");
    return;
  }

  const maxCases = TIER_LIMITS[tier].maxCases;
  if (existing.length >= maxCases) {
    // A plain Error, not a custom class — "use server" files may only
    // export async functions, so a thrown error class can't live here.
    throw new Error(
      `You're tracking the maximum of ${maxCases} case${maxCases === 1 ? "" : "s"} on your current plan.`
    );
  }

  await db.insert(trackedCases).values({
    userId: session.user.id,
    receiptNumber: encryptField(receiptNumber),
    email: encryptField(session.user.email),
    caseType,
  });

  revalidatePath("/dashboard");
  revalidatePath("/ask");
}

export async function untrackCase(id: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in required.");
  }

  const db = getDb();
  await db
    .delete(trackedCases)
    .where(and(eq(trackedCases.id, id), eq(trackedCases.userId, session.user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/ask");
}
