// CW-35/36 packaging — confirmed by Peter (see CLOUD_CLAUDE.md "Pricing/
// packaging decision" for the full reasoning): one bundled paid tier,
// "CaseWhy Plus," $9.99/mo, unlocking unlimited AI chat and up to 5 tracked
// cases together (not separate SKUs).
//
// Round 13 — live billing (Stripe test mode). `tier` is now kept in sync by
// the Stripe webhook handler (src/app/api/webhooks/stripe/route.ts), not
// just a manual/debug script — see src/lib/db/schema.ts's `subscriptions`
// table comment for the exact downgrade-timing rule this file relies on.

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

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
}

/** Fuller subscription state for the /plus page and CTA branching — whether to show "Subscribe," "Manage subscription," or a "canceling on <date>" notice. */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails> {
  const db = getDb();
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return {
    tier: row?.tier ?? "free",
    status: row?.status ?? null,
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    hasStripeCustomer: !!row?.stripeCustomerId,
  };
}
