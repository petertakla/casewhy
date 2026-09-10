// Round 26 — server-side push send via web-push, wired into the same
// notify path checkTrackedCaseNow() already uses for the Postmark email.
//
// Round 57 — setVapidDetails() used to run at module load time, which
// meant merely *importing* this file (e.g. through check-status.ts's
// import chain, pulled in by /api/chat and the dashboard's checkCaseNow
// action) threw if VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY weren't set,
// regardless of whether push was ever actually used — this is exactly what
// broke GitHub Actions CI (no VAPID secrets configured there) and would
// have broken any other environment missing just these two vars for the
// same reason, unrelated to what it was actually trying to do. Lazy-init
// instead: only required when a push send is genuinely attempted.

import webpush from "web-push";
import { getPushSubscriptionsForUser, deletePushSubscriptionByEndpoint, type StoredPushSubscription } from "./subscriptions";

let vapidConfigured = false;
function ensureVapidConfigured(): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    "mailto:hello@casewhy.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidConfigured = true;
}

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
  ensureVapidConfigured();
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
