"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { getEffectivePrice, getAllEffectivePrices, PLAN_LABELS, PLAN_IDS, type PlanId } from "@/lib/billing/pricing";
import { getLiveSubscriptionDetail } from "@/lib/billing/live-subscription";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Round 115, Part 1 — the one real, persistent Stripe Product every plan's
 * price attaches to (see startCheckout's own comment for why this has to
 * be a real product id, not an inline product_data). Reused from round
 * 13's original CaseWhy Plus product (`prod_VDBWrDdlau1nST`) rather than
 * creating a duplicate -- confirmed still active via a direct
 * `stripe.products.list()` check before wiring this in.
 */
function requireStripePlusProductId(): string {
  const id = process.env.STRIPE_PLUS_PRODUCT_ID;
  if (!id) throw new Error("STRIPE_PLUS_PRODUCT_ID isn't set.");
  return id;
}

async function requireSubscriptionRow(userId: string) {
  const db = getDb();
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  if (!row?.stripeSubscriptionId) {
    throw new Error("No active Plus subscription found for this account.");
  }
  return row;
}

/**
 * Matches a live Stripe price (interval/interval_count) back to one of
 * CaseWhy's own PlanId values. There's no stored planId anywhere (see
 * live-subscription.ts's own comment on why -- always read live from
 * Stripe rather than a column that could drift from what's actually
 * charged), so this is how "which plan is the subscriber currently on"
 * gets answered, here and in the Settings Plan section alike.
 */
async function currentPlanId(interval: string, intervalCount: number): Promise<PlanId | null> {
  const prices = await getAllEffectivePrices();
  for (const planId of PLAN_IDS) {
    const p = prices[planId];
    if (p.billingInterval === interval && p.intervalCount === intervalCount) return planId;
  }
  return null;
}

export interface ManagePlanData {
  currentPlanId: PlanId | null;
  currentAmountCents: number;
  currentCurrency: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  plans: Array<{ planId: PlanId; label: string; priceCents: number; billingInterval: string; intervalCount: number }>;
}

/** Everything /plus/manage needs to render: the subscriber's real current plan (read live from Stripe, never assumed) plus every plan option's current effective price. */
export async function getManagePlanData(): Promise<ManagePlanData> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const row = await requireSubscriptionRow(session.user.id);
  const live = await getLiveSubscriptionDetail(row.stripeSubscriptionId!);
  if (!live) throw new Error("Couldn't read the live subscription from Stripe.");

  const prices = await getAllEffectivePrices();
  const plans = PLAN_IDS.map((planId) => ({
    planId,
    label: PLAN_LABELS[planId],
    priceCents: prices[planId].priceCents,
    billingInterval: prices[planId].billingInterval,
    intervalCount: prices[planId].intervalCount,
  }));

  return {
    currentPlanId: await currentPlanId(live.interval, live.intervalCount),
    currentAmountCents: live.amountCents,
    currentCurrency: live.currency,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: row.currentPeriodEnd,
    plans,
  };
}

export interface PlanSwitchPreview {
  /** Positive = charged today, negative = credited, 0 = no immediate change. */
  amountDueCents: number;
  currency: string;
}

/** Stripe's own proration math for switching to `newPlan` today -- never computed by CaseWhy itself, so it's always exactly what would actually be charged. */
export async function previewPlanSwitch(newPlan: PlanId): Promise<PlanSwitchPreview> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const row = await requireSubscriptionRow(session.user.id);
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId!);
  const item = sub.items.data[0];
  if (!item) throw new Error("Subscription has no line item to switch.");

  const price = await getEffectivePrice(newPlan);
  const preview = await stripe.invoices.createPreview({
    customer: row.stripeCustomerId!,
    subscription: row.stripeSubscriptionId!,
    subscription_details: {
      proration_behavior: "create_prorations",
      // Real bug found live-testing this against Stripe test mode: without
      // resetting the billing cycle, switching between different interval
      // *types* (month -> year) double-charged -- Stripe billed a full
      // extra period on top of the real prorated switch (confirmed via the
      // preview's own line items: two separate "1 x CaseWhy Plus" full-
      // period charges instead of one). billing_cycle_anchor: "now" resets
      // the cycle to start at the switch moment, which is also just the
      // semantically correct behavior for "you're switching today" --
      // verified clean (one credit line + one new-plan line, correct
      // total) across month->year and month->month interval-count changes.
      billing_cycle_anchor: "now",
      items: [
        {
          id: item.id,
          price_data: {
            currency: "usd",
            unit_amount: price.priceCents,
            recurring: { interval: price.billingInterval, interval_count: price.intervalCount },
            product: requireStripePlusProductId(),
          },
        },
      ],
    },
  });

  return { amountDueCents: preview.total, currency: preview.currency };
}

/** Actually switches the subscription to `newPlan`, prorated. The existing customer.subscription.updated webhook picks up the change the same way it already handles every other subscription update -- no webhook change needed, since plan/price is always read live (see currentPlanId's own comment), never cached. */
export async function switchPlan(newPlan: PlanId): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const row = await requireSubscriptionRow(session.user.id);
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId!);
  const item = sub.items.data[0];
  if (!item) throw new Error("Subscription has no line item to switch.");

  const price = await getEffectivePrice(newPlan);
  await stripe.subscriptions.update(row.stripeSubscriptionId!, {
    proration_behavior: "create_prorations",
    // Same fix as previewPlanSwitch's own comment -- must match exactly,
    // since a mismatched anchor between preview and the real switch would
    // let the confirmed preview total drift from what's actually charged.
    billing_cycle_anchor: "now",
    items: [
      {
        id: item.id,
        price_data: {
          currency: "usd",
          unit_amount: price.priceCents,
          recurring: { interval: price.billingInterval, interval_count: price.intervalCount },
          product: requireStripePlusProductId(),
        },
      },
    ],
  });
}

/**
 * Downgrade to Free at period end -- the same underlying mechanism as
 * "Cancel" (cancel_at_period_end), presented as one de-emphasized option
 * among several on /plus/manage rather than the page's default or only
 * action (task doc's own explicit ask). Matches the round-13 webhook's
 * existing design: tier stays "plus" through the paid period, only flips
 * to "free" once the period genuinely ends (customer.subscription.deleted
 * or the next customer.subscription.updated confirms it).
 */
export async function downgradeToFreeAtPeriodEnd(): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const row = await requireSubscriptionRow(session.user.id);
  const stripe = getStripe();
  await stripe.subscriptions.update(row.stripeSubscriptionId!, { cancel_at_period_end: true });
}

/**
 * Starts a Stripe Checkout Session (hosted page, subscription mode) and
 * redirects there. The webhook, not this redirect, is the source of truth
 * for actually flipping the account to Plus — a user can close the tab
 * before landing back here.
 *
 * Round 50 — takes which plan (monthly/quarterly/annual) was chosen, and
 * builds the line item as inline Stripe `price_data` computed from
 * plan_prices + any active pricing_rules row (src/lib/billing/pricing.ts)
 * rather than a pre-created Stripe Price ID — confirmed the current Stripe
 * API supports `price_data.recurring` on a subscription-mode line item, so
 * a price change never needs a new Price object, just a pricing_rules row.
 */
export async function startCheckout(plan: PlanId): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const details = await getSubscriptionDetails(session.user.id);
  if (details.tier === "plus") {
    // Already Plus — send to the portal instead of a duplicate checkout.
    return openBillingPortal();
  }

  const origin = await getOrigin();
  const stripe = getStripe();
  const price = await getEffectivePrice(plan);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: price.priceCents,
          recurring: { interval: price.billingInterval, interval_count: price.intervalCount },
          // Round 115, Part 1 — the one real, persistent "CaseWhy Plus"
          // Product (created round 13, reused rather than duplicated),
          // not an inline product_data throwaway. subscriptions.update's
          // own price_data (used by the new /plus/manage switch flow)
          // has no product_data option, only a real product id -- every
          // subscription needs to already be on that same Product for a
          // later switch to work, so checkout has to use it too.
          product: requireStripePlusProductId(),
        },
        quantity: 1,
      },
    ],
    customer_email: details.hasStripeCustomer ? undefined : session.user.email,
    client_reference_id: session.user.id,
    automatic_tax: { enabled: true },
    // Round 50 Part 2 — Stripe's own hosted "Add promotion code" field at
    // checkout. Redemption is entirely Stripe-side (Coupons + Promotion
    // Codes created in the dashboard); no CaseWhy schema or validation.
    allow_promotion_codes: true,
    success_url: `${origin}/plus?checkout=success`,
    cancel_url: `${origin}/plus?checkout=cancelled`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a Checkout Session URL.");
  }
  redirect(checkoutSession.url);
}

/** Self-service cancel / payment-method-update via Stripe's own hosted Billing Portal. */
export async function openBillingPortal(): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const db = getDb();
  const [row] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));

  if (!row?.stripeCustomerId) {
    throw new Error("No subscription found for this account.");
  }

  const origin = await getOrigin();
  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${origin}/plus`,
  });

  redirect(portalSession.url);
}
