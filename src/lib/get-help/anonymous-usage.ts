// Round 71 — durable, never-resetting replacement for rate-limit.ts's
// in-memory 24-hour rolling window. See that file (kept only for
// clientKeyFromHeaders(), still reused here) and schema.ts's
// anonymousQuestionUsage comment for the full "why" — the short version:
// a resetting daily cap was a better long-run deal for a signed-out
// visitor than a signed-in free account's 3-per-month cap, exactly
// backwards from the intended nudge toward signing up.
//
// Identity design call (Claude Code's, per the task doc — not Peter's):
// key on IP address alone, not a first-party cookie/device id, and not
// both. Tradeoff, stated plainly:
//   - IP alone: simple, no new client-side state, no new privacy-policy
//     disclosure needed (an IP is already a normal request-log field, not
//     a persistent identifier CaseWhy chooses to store client-side).
//     Downside: a shared IP (NAT, corporate network, campus wifi) pools
//     multiple real people under one counter, so a genuine visitor could
//     occasionally hit a cap someone else on their network already spent.
//   - Cookie/device id alone: more precisely one-counter-per-browser, but
//     trivially defeated by the exact abuser this cap exists to slow down
//     (clear cookies, get 3 more) — actively worse at the one thing a
//     *lifetime* cap needs to hold up against.
//   - Both together (count against whichever is stricter): the most
//     correct, but adds real complexity (a new cookie, its own consent/
//     disclosure question, two code paths to keep in sync) for a
//     pre-revenue product with no real abuse pattern yet to justify it.
// IP alone is the smallest change that actually fixes "must never reset"
// (its whole point), and the shared-IP false-positive case still has a
// reasonable fallback: sign up for a free account instead — which is
// exactly the audience this feature already wants to nudge that way.
// Revisit if real usage shows IP-sharing false-positives are common.

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { anonymousQuestionUsage } from "@/lib/db/schema";

/** Extracts a real client identifier from standard proxy headers (Vercel sets x-forwarded-for). Falls back to a constant key if genuinely unavailable, which degrades to a single shared bucket rather than failing open with no limit at all. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// Same number as before (round 63's unification with the signed-in free
// tier's 3-per-month cap) — only the window ("day" -> "ever") changed.
export const LIFETIME_CAP_PER_IP = 3;

export interface AnonymousUsageStatus {
  count: number;
  allowed: boolean;
  remaining: number;
}

export async function getAnonymousQuestionUsage(clientKey: string): Promise<AnonymousUsageStatus> {
  const db = getDb();
  const [row] = await db
    .select({ count: anonymousQuestionUsage.count })
    .from(anonymousQuestionUsage)
    .where(eq(anonymousQuestionUsage.clientKey, clientKey))
    .limit(1);

  const count = row?.count ?? 0;
  return {
    count,
    allowed: count < LIFETIME_CAP_PER_IP,
    remaining: Math.max(0, LIFETIME_CAP_PER_IP - count),
  };
}

/** Increments this client's lifetime count by one. Call only after a successful reply — same "don't burn a question on a failed call" rule as src/lib/billing/chat-usage.ts. */
export async function incrementAnonymousQuestionUsage(clientKey: string): Promise<void> {
  const db = getDb();
  await db
    .insert(anonymousQuestionUsage)
    .values({ clientKey, count: 1 })
    .onConflictDoUpdate({
      target: anonymousQuestionUsage.clientKey,
      set: {
        count: sql`${anonymousQuestionUsage.count} + 1`,
        lastSeenAt: sql`now()`,
      },
    });
}
