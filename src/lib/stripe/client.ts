// Round 13 — lazy Stripe client, same pattern as src/lib/db/client.ts's
// getDb(). Stripe test-mode keys until Peter explicitly flips to live
// keys (see CLOUD_CLAUDE.md round 13 — that switch is his call, not
// something this code does automatically based on any env-var presence).

import Stripe from "stripe";

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing required env var STRIPE_SECRET_KEY.");
    }
    client = new Stripe(key);
  }
  return client;
}

/** The Stripe Price ID for CaseWhy Plus ($9.99/mo). Created once in the Stripe dashboard (test mode), not something this code creates on the fly. */
export function getPlusPriceId(): string {
  const priceId = process.env.STRIPE_PLUS_PRICE_ID;
  if (!priceId) {
    throw new Error("Missing required env var STRIPE_PLUS_PRICE_ID.");
  }
  return priceId;
}
