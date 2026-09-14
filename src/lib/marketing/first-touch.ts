// Round 93 Part C — first-touch capture, called from src/middleware.ts
// (the one place that already runs on every request in the nodejs
// runtime with direct DB access — see that file's own comment for why
// there's no separate sign-up webhook to hook instead).

import { sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { firstTouchAttribution, marketingLandingCounts } from "../db/schema";

export const FIRST_TOUCH_COOKIE = "cw_first_touch";
export const FIRST_TOUCH_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

export interface FirstTouch {
  source: string;
  medium: string;
  campaign: string;
  at: string; // ISO timestamp when the cookie was set
}

/** One row per (source, medium, campaign), count incremented in place — see schema.ts's comment on why not one row per visit. */
export async function recordLanding(params: { source: string; medium: string; campaign: string }): Promise<void> {
  const db = getDb();
  await db
    .insert(marketingLandingCounts)
    .values({ ...params, count: 1 })
    .onConflictDoUpdate({
      target: [marketingLandingCounts.source, marketingLandingCounts.medium, marketingLandingCounts.campaign],
      set: { count: sql`${marketingLandingCounts.count} + 1`, lastSeenAt: new Date() },
    });
}

/** Attaches a user's first-touch source to their account, once — onConflictDoNothing means only the true first call ever writes. */
export async function recordFirstTouchForUser(userId: string, touch: FirstTouch): Promise<void> {
  const db = getDb();
  await db
    .insert(firstTouchAttribution)
    .values({
      userId,
      source: touch.source,
      medium: touch.medium,
      campaign: touch.campaign,
      firstTouchAt: new Date(touch.at),
    })
    .onConflictDoNothing({ target: firstTouchAttribution.userId });
}
