"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { getEffectivePrice, PLAN_LABELS, type PlanId } from "@/lib/billing/pricing";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
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
          product_data: { name: PLAN_LABELS[plan] },
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
