// Round 116 — evergreen weekday fallback orchestration. Called from
// /api/cron/poll-policy-news (real-time, "today") and from
// scripts/backfill-evergreen-week.ts (explicit future dates, so a whole
// week's content can be queued ahead of time for one Sunday-evening
// review). Idempotent either way: the synthetic
// `evergreen:{type}:{yyyy-mm-dd}` destination key is unique per (channel,
// destination, locale), so re-running for a date that already has rows
// is a safe no-op via onConflictDoNothing, same pattern poll-policy-news
// already uses for real news items.

import { and, eq, gte, lt } from "drizzle-orm";
import type { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { draftEvergreenXThread, draftEvergreenThreadsPost, draftEvergreenFacebookPost, type EvergreenItemInput } from "../draft-evergreen-post";
import { WEEKDAY_EVERGREEN_TYPE, NEWS_AWARE_WEEKDAYS, buildTopicForType, buildRecapTopic, type EvergreenType } from "./topics";

// 10am ET (UTC-4 during EDT, which covers this rollout window) -- a fixed,
// reasonable weekday-morning posting time. Not DST-adjusted; a real
// scheduling-precision fix isn't warranted for a "some time that morning"
// guarantee.
const SCHEDULED_HOUR_UTC = 14;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function scheduledForDate(date: Date): Date {
  const start = dayStart(date);
  start.setUTCHours(SCHEDULED_HOUR_UTC, 0, 0, 0);
  return start;
}

async function hasRealNewsToday(db: ReturnType<typeof getDb>, date: Date): Promise<boolean> {
  const start = dayStart(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const rows = await db
    .select({ destination: marketingQueue.destination })
    .from(marketingQueue)
    .where(
      and(
        eq(marketingQueue.channel, "x"),
        eq(marketingQueue.mode, "auto_post"),
        gte(marketingQueue.createdAt, start),
        lt(marketingQueue.createdAt, end)
      )
    );
  // Real news rows never use the evergreen: destination prefix.
  return rows.some((r) => !r.destination.startsWith("evergreen:"));
}

async function queueTopic(db: ReturnType<typeof getDb>, type: EvergreenType | "recap", item: EvergreenItemInput, date: Date): Promise<boolean> {
  const destination = `evergreen:${type}:${dateKey(date)}`;
  const scheduledFor = scheduledForDate(date);

  const [xDraft, threadsDraft, facebookDraft] = await Promise.all([
    draftEvergreenXThread(item),
    draftEvergreenThreadsPost(item),
    draftEvergreenFacebookPost(item),
  ]);

  const citation = item.sourceUrl ? `${item.sourceName} — ${item.sourceUrl}` : item.sourceName;
  let anyQueued = false;

  for (const [channel, draft] of [
    ["x", xDraft],
    ["threads", threadsDraft],
    ["facebook", facebookDraft],
  ] as const) {
    if (!draft) continue;
    anyQueued = true;
    await db
      .insert(marketingQueue)
      .values({
        channel,
        mode: "auto_post",
        destination,
        draftText: draft.posts.join("\n\n---\n\n"),
        sourceCitations: citation,
        guardrailNotes: `Round 116 evergreen weekday fallback (${type}) -- scheduled for ${dateKey(date)}. Approving before that date holds the post (doesn't fire early); /api/cron/post-scheduled posts it once the date arrives.`,
        locale: "en",
        status: "pending",
        scheduledFor,
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  }
  return anyQueued;
}

export interface EnsureEvergreenResult {
  weekday: number;
  skippedWeekend?: boolean;
  skippedRealNewsPresent?: boolean;
  skippedNoRecapHistory?: boolean;
  queued?: boolean;
  type?: EvergreenType | "recap";
}

/** ISO weekday: 1=Mon .. 7=Sun. */
function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export async function ensureEvergreenForDate(db: ReturnType<typeof getDb>, date: Date): Promise<EnsureEvergreenResult> {
  const weekday = isoWeekday(date);

  if (weekday === 5) {
    const recap = await buildRecapTopic(db, date);
    if (!recap) return { weekday, skippedNoRecapHistory: true };
    const queued = await queueTopic(db, "recap", recap, date);
    return { weekday, queued, type: "recap" };
  }

  if (weekday === 6 || weekday === 7) return { weekday, skippedWeekend: true };

  if (NEWS_AWARE_WEEKDAYS.has(weekday) && (await hasRealNewsToday(db, date))) {
    return { weekday, skippedRealNewsPresent: true };
  }

  const type = WEEKDAY_EVERGREEN_TYPE[weekday];
  const item = buildTopicForType(type);
  const queued = await queueTopic(db, type, item, date);
  return { weekday, queued, type };
}
