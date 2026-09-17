// Round 114 follow-up — Peter, testing Plus as admin@casewhy.com: "it
// doesn't show the tier anywhere." The subscriptions table stores tier/
// status/currentPeriodEnd/cancelAtPeriodEnd, but not which specific plan
// (monthly/quarterly/annual) or price a subscriber picked at checkout —
// that only exists on the Stripe Subscription object itself. Rather than
// add a planId column that could drift from what Stripe actually charges
// (a price change via the portal wouldn't update it), this reads live
// from Stripe every time — the real source of truth, never hard-coded.

import { getStripe } from "@/lib/stripe/client";

export interface LiveSubscriptionDetail {
  amountCents: number;
  currency: string;
  interval: string;
  intervalCount: number;
  /** Real Stripe subscription creation date -- "subscribed since". */
  startDate: Date;
}

export async function getLiveSubscriptionDetail(stripeSubscriptionId: string): Promise<LiveSubscriptionDetail | null> {
  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const item = sub.items.data[0];
    const price = item?.price;
    if (!price || price.unit_amount == null || !price.recurring) return null;
    return {
      amountCents: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval as string,
      intervalCount: price.recurring.interval_count,
      startDate: new Date(sub.created * 1000),
    };
  } catch {
    // Stripe unreachable, or the subscription no longer exists there —
    // callers fall back to the cached subscriptions table fields.
    return null;
  }
}
