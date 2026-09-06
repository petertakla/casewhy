"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { getStripe, getPlusPriceId } from "@/lib/stripe/client";
import { getSubscriptionDetails } from "@/lib/billing/tier";

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
 */
export async function startCheckout(): Promise<void> {
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

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: getPlusPriceId(), quantity: 1 }],
    customer_email: details.hasStripeCustomer ? undefined : session.user.email,
    client_reference_id: session.user.id,
    automatic_tax: { enabled: true },
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
