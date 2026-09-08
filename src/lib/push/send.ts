// Round 26 — server-side push send via web-push, wired into the same
// notify path checkTrackedCaseNow() already uses for the Postmark email.

import webpush from "web-push";
import { getPushSubscriptionsForUser, deletePushSubscriptionByEndpoint, type StoredPushSubscription } from "./subscriptions";

webpush.setVapidDetails(
  "mailto:hello@casewhy.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface CaseStatusPushPayload {
  title: string;
  body: string;
  /** Path to open on notification click, e.g. "/dashboard?receipt=EAC...". */
  url: string;
}

/**
 * Sends a push to every subscription this user has (multiple
 * devices/browsers). A 404/410 response means the subscription is dead
 * (unsubscribed, or the browser/OS discarded it) — deleted rather than
 * retried, same "don't keep hammering a dead endpoint" reasoning as any
 * webhook/notification integration.
 */
export async function sendPushToUser(userId: string, payload: CaseStatusPushPayload): Promise<void> {
  const subs = await getPushSubscriptionsForUser(userId);
  await Promise.all(subs.map((sub) => sendToOneSubscription(sub, payload)));
}

async function sendToOneSubscription(sub: StoredPushSubscription, payload: CaseStatusPushPayload): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscriptionByEndpoint(sub.endpoint);
      return;
    }
    // Any other failure (network blip, malformed payload) — log and move
    // on; push is a best-effort supplementary channel, the email send
    // alongside it is the one that must not be silently swallowed.
    console.error("Push send failed", { endpoint: sub.endpoint, statusCode, err });
  }
}
