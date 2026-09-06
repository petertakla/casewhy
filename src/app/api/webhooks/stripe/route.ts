import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "@/lib/db/client";
import { subscriptions, stripeWebhookEvents } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";

// Round 13 — Stripe webhook, source of truth for subscription state (never
// the Checkout success redirect, which a user can just close the tab on).
//
// Downgrade timing, decided Sep 6 (see schema.ts's subscriptions comment):
// `tier` stays "plus" through the paid period even after cancellation is
// requested (cancel_at_period_end) or a payment fails (past_due) — only
// customer.subscription.deleted (or the period genuinely ending) flips
// tier back to "free". Cases 2-5 are never deleted on downgrade, just no
// longer pollable/interactable beyond the free cap — enforced by the
// existing TIER_LIMITS checks elsewhere, not by anything in this file.

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  const db = getDb();

  // Idempotency — Stripe can and does redeliver events. A unique-violation
  // on insert means we've already processed this exact event ID.
  try {
    await db.insert(stripeWebhookEvents).values({ id: event.id, type: event.type });
  } catch (err) {
    const pgError = err instanceof Error && err.cause instanceof Error ? err.cause : err;
    const isUniqueViolation =
      typeof pgError === "object" && pgError !== null && "code" in pgError && pgError.code === "23505";
    if (isUniqueViolation) {
      return NextResponse.json({ received: true, deduped: true });
    }
    throw err;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && session.customer && session.subscription) {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(userId, session.customer as string, sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await findUserIdForCustomer(sub.customer as string);
      if (userId) await upsertSubscription(userId, sub.customer as string, sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await findUserIdForCustomer(sub.customer as string);
      if (userId) {
        await db
          .update(subscriptions)
          .set({ tier: "free", status: sub.status, cancelAtPeriodEnd: false, updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
      }
      break;
    }
    case "invoice.payment_failed": {
      // Stripe's own retry schedule runs; we just mark past_due and keep
      // Plus access. The subscription only actually ends (and tier flips
      // to free) via a later customer.subscription.deleted/updated event.
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const userId = await findUserIdForCustomer(customerId);
        if (userId) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptions.userId, userId));
        }
      }
      break;
    }
    default:
      break; // ignore event types we don't act on
  }

  return NextResponse.json({ received: true });
}

async function findUserIdForCustomer(stripeCustomerId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
  return row?.userId ?? null;
}

async function upsertSubscription(userId: string, stripeCustomerId: string, sub: Stripe.Subscription) {
  const db = getDb();
  const currentPeriodEnd = sub.items.data[0]?.current_period_end;
  await db
    .insert(subscriptions)
    .values({
      userId,
      tier: "plus",
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        tier: "plus",
        stripeCustomerId,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });
}
