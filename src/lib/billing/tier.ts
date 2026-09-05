// CW-35/36 packaging — confirmed by Peter (see CLOUD_CLAUDE.md "Pricing/
// packaging decision" for the full reasoning): one bundled paid tier,
// "CaseWhy Plus," $9.99/mo, unlocking unlimited AI chat and up to 5 tracked
// cases together (not separate SKUs).
//
// IMPORTANT: this is schema/logic only, not live billing. No LLC, no
// Stripe/payment processor, and no lawyer-reviewed ToS exist yet — this
// file is the plumbing that a real payment webhook would write to once
// those prerequisites exist, not a working purchase path. Until then,
// every account is "free" (no row in `subscriptions` = free).

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";

export type SubscriptionTier = "free" | "plus";

export interface TierLimits {
  maxCases: number;
  /** null = unlimited */
  chatQuestionsPerMonth: number | null;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { maxCases: 1, chatQuestionsPerMonth: 10 },
  plus: { maxCases: 5, chatQuestionsPerMonth: null },
};

export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const db = getDb();
  const [row] = await db
    .select({ tier: subscriptions.tier })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return row?.tier ?? "free";
}
