// CW-35/36 packaging — confirmed by Peter (see CLOUD_CLAUDE.md "Pricing/
// packaging decision" for the full reasoning): one bundled paid tier,
// "CaseWhy Plus," $9.99/mo, unlocking unlimited AI chat and (round 46)
// marketed as unlimited case tracking, technically gated in three bands —
// see PLUS_HARD_CEILING_MAX_CASES below.
//
// Round 13 — live billing (Stripe test mode). `tier` is now kept in sync by
// the Stripe webhook handler (src/app/api/webhooks/stripe/route.ts), not
// just a manual/debug script — see src/lib/db/schema.ts's `subscriptions`
// table comment for the exact downgrade-timing rule this file relies on.
//
// Round 17 — case cap raised 5 -> 10 (Peter's direct call, supersedes the
// round-14/CW-36 decision to hold at 5 over reselling-risk concerns).
// TIER_LIMITS.plus.maxCases (10) is now the auto-approved band's ceiling,
// not a hard cap — see PLUS_HARD_CEILING_MAX_CASES.
//
// Round 47 — free-tier cap raised 1 -> 3 (Peter's direct call, matching
// VisaWatch's free tier per the Sep 9 pricing recheck — the one place
// CaseWhy was measurably more restrictive than a named competitor).

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
  free: { maxCases: 3, chatQuestionsPerMonth: 10 },
  plus: { maxCases: 10, chatQuestionsPerMonth: null },
};

// Round 46 — Plus is marketed as unlimited case tracking, backed by a
// technical review gate rather than a flat cap or true unlimited: two real
// constraints, not just a hunch — reselling economics (a flat-rate account
// with truly unlimited tracking could be informally shared across an
// unrelated group) and the shared USCIS API production quota (the daily
// cron polls every *active* tracked case against a budget shared across
// CaseWhy's entire user base, not per-account). 1-10 auto-approved
// (TIER_LIMITS.plus.maxCases above), 11-25 queued as "pending_review" until
// a one-click admin approval raises the account's effectiveMaxCases to 25,
// above 25 a hard ceiling with no review path at all (a genuinely
// different bulk/organizational use case, routed to a real conversation
// instead). These are Peter's-recommendation defaults, not fixed forever —
// worth revisiting once the still-pending USCIS-quota scalability audit
// reports real headroom.
export const PLUS_HARD_CEILING_MAX_CASES = 25;

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
  /** Plus's own gated-unlimited cap for this account — 10 until an admin
   * approval raises it to 25 (PLUS_HARD_CEILING_MAX_CASES). Meaningless for
   * free-tier accounts, which use TIER_LIMITS.free.maxCases directly. */
  effectiveMaxCases: number;
}

/** Fuller subscription state for the /plus page and CTA branching — whether to show "Subscribe," "Manage subscription," or a "canceling on <date>" notice. */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails> {
  const db = getDb();
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const tier = row?.tier ?? "free";
  return {
    tier,
    status: row?.status ?? null,
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    hasStripeCustomer: !!row?.stripeCustomerId,
    effectiveMaxCases: row?.effectiveMaxCases ?? TIER_LIMITS[tier].maxCases,
  };
}
