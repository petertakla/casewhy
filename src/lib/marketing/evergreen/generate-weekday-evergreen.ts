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
import { draftEvergreenXThread, draftEvergreenThreadsPost, draftEvergreenFacebookPost } from "../draft-evergreen-post";
import { generateImage } from "../gemini/image";
import { uploadMarketingAsset } from "../gemini/storage";
import { isChannelPostable } from "../channel-config";
import { WEEKDAY_EVERGREEN_TYPE, NEWS_AWARE_WEEKDAYS, buildTopicForType, buildRecapTopic, type EvergreenType, type EvergreenTopicWithImage } from "./topics";

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

async function queueTopic(db: ReturnType<typeof getDb>, type: EvergreenType | "recap", item: EvergreenTopicWithImage, date: Date): Promise<boolean> {
  const destination = `evergreen:${type}:${dateKey(date)}`;
  const scheduledFor = scheduledForDate(date);

  // Round 119 — same per-channel enabled/frequency gate as poll-policy-
  // news, checked before any drafting so a disabled channel costs
  // nothing (no LLM call, no image generation).
  const [xOn, threadsOn, facebookOn, instagramOn] = await Promise.all([
    isChannelPostable("x"),
    isChannelPostable("threads"),
    isChannelPostable("facebook"),
    isChannelPostable("instagram"),
  ]);

  const [xDraft, threadsDraft, facebookDraft] = await Promise.all([
    xOn ? draftEvergreenXThread(item) : null,
    threadsOn ? draftEvergreenThreadsPost(item) : null,
    facebookOn ? draftEvergreenFacebookPost(item) : null,
  ]);

  const citation = item.sourceUrl ? `${item.sourceName} — ${item.sourceUrl}` : item.sourceName;
  const guardrailNote = `Round 116 evergreen weekday fallback (${type}) -- scheduled for ${dateKey(date)}. Approving before that date holds the post (doesn't fire early); /api/cron/post-scheduled posts it once the date arrives.`;
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
        guardrailNotes: guardrailNote,
        locale: "en",
        status: "pending",
        scheduledFor,
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  }

  // Round 116 follow-up (Peter: "add instagram because it is fixed") --
  // Instagram's poster requires a real media URL (it throws otherwise),
  // so it can't reuse the plain-text drafts above. Reuses the same
  // Gemini image pipeline round 91 already built and verified live for
  // Pinterest/YouTube/TikTok/Instagram content briefs, rather than
  // inventing a second image-generation path. Caption reuses whichever
  // text draft succeeded (Facebook's own length/tone is the closest fit
  // for an Instagram caption) -- no separate caption-drafting call.
  const caption = facebookDraft?.posts[0] ?? threadsDraft?.posts[0] ?? xDraft?.posts[0];
  if (caption && instagramOn) {
    try {
      const image = await generateImage({
        imagePrompt: item.imagePrompt,
        headline: item.imageHeadline,
        format: "square_graphic",
        locale: "en",
        showTagline: true,
      });
      const assetUrl = await uploadMarketingAsset({
        pillar: "get-help", // closest existing content_briefs pillar; evergreen topics don't have their own pillar value and this field only affects the storage path, not any DB constraint.
        briefId: `evergreen-${type}-${dateKey(date)}`,
        fileName: "square_graphic.png",
        contentType: "image/png",
        data: image.buffer,
      });
      anyQueued = true;
      await db
        .insert(marketingQueue)
        .values({
          channel: "instagram",
          mode: "auto_post",
          destination,
          draftText: caption,
          mediaRefs: assetUrl,
          sourceCitations: citation,
          guardrailNotes: `${guardrailNote} Image generated via Gemini (${image.width}x${image.height}) -- review legibility before approving.`,
          locale: "en",
          status: "pending",
          scheduledFor,
        })
        .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
    } catch (err) {
      // Image generation failing shouldn't take down the text-only
      // channels above -- same per-channel isolation as everywhere else
      // in this pipeline (Promise.allSettled-style resilience).
      console.error(`evergreen instagram image failed for ${destination}:`, err instanceof Error ? err.message : err);
    }
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
