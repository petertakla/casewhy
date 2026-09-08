// Round 26 — storage for Web Push subscriptions. One row per browser/
// device (see schema.ts's own comment on why there's no separate
// "enabled" boolean).

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";

export interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function savePushSubscription(userId: string, sub: PushSubscriptionKeys): Promise<void> {
  const db = getDb();
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      // Same endpoint re-subscribing (e.g. after a service-worker update)
      // can carry new keys — always take the latest, and re-attach to
      // whichever user just subscribed with it.
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const db = getDb();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function getPushSubscriptionsForUser(userId: string): Promise<StoredPushSubscription[]> {
  const db = getDb();
  return db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}
