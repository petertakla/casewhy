// Round 112 Part B — X's free API tier caps write (post) calls at 500 per
// rolling calendar month, app-wide. postToX (x.ts) wasn't checking this at
// all -- exceeding it mid-thread would fail the remaining posts with a
// real 429 and no advance warning, and repeatedly hitting the cap risks
// the app's write access getting suspended. There's no local counter this
// codebase already keeps, and X's own usage-stats endpoint needs OAuth 2.0
// app-only auth (a separate credential this project doesn't have, per
// x.ts's own OAuth 1.0a choice) -- so this counts real writes already
// recorded in marketing_queue itself: one row can be a whole thread (see
// x.ts's "\n\n---\n\n" split), and X counts each tweet in a thread as its
// own write, so this sums split-post counts per row, not row counts.

import { and, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";

export const X_FREE_TIER_MONTHLY_WRITE_LIMIT = 500;

function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function writeCountForDraft(draftText: string | null): number {
  if (!draftText) return 0;
  return draftText
    .split(/\n\n---\n\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

/** Real posted-tweet count so far this calendar month, summed across every posted/edited_posted X row. */
export async function getMonthlyXWriteCount(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ draftText: marketingQueue.draftText })
    .from(marketingQueue)
    .where(
      and(
        eq(marketingQueue.channel, "x"),
        inArray(marketingQueue.status, ["posted", "edited_posted"]),
        gte(marketingQueue.postedAt, startOfCurrentMonthUtc())
      )
    );
  return rows.reduce((sum, row) => sum + writeCountForDraft(row.draftText), 0);
}

/**
 * Throws a clear, specific error (never a silent skip) if posting
 * `plannedWrites` more tweets this month would exceed the free-tier cap --
 * postToX calls this before making any real API call, so a thread either
 * posts in full or not at all, never partially with a confusing 429
 * partway through.
 */
export async function assertXWriteBudget(plannedWrites: number): Promise<void> {
  const used = await getMonthlyXWriteCount();
  if (used + plannedWrites > X_FREE_TIER_MONTHLY_WRITE_LIMIT) {
    throw new Error(
      `X free-tier monthly write limit would be exceeded: ${used} already used this month, ` +
        `this post needs ${plannedWrites} more, cap is ${X_FREE_TIER_MONTHLY_WRITE_LIMIT}. ` +
        `Wait until next calendar month, or upgrade the X API tier (round 112's "free before paid" ` +
        `standing order applies -- needs Peter's own go-ahead and payment method).`
    );
  }
}
