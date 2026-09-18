// Round 91 — orchestrates one content_briefs row through generation,
// storage, and queue-item creation. Called by /api/cron/render-content-
// briefs (round 91's weekly cron) and by the admin "render now" action
// for manual triggering during review.

import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { contentBriefs, marketingQueue } from "@/lib/db/schema";
import { getGeminiVideoMonthlyCap } from "@/lib/marketing/config";
import { generateImage } from "./image";
import { generateVideo } from "./video";
import { uploadMarketingAsset } from "./storage";
import { SHORT_VIDEO_MAX_SECONDS } from "./config";

const FORMATS = ["pin", "short_video", "square_graphic", "story"] as const;

async function videosRenderedThisMonth(): Promise<number> {
  const db = getDb();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ n: count() })
    .from(contentBriefs)
    .where(
      and(
        eq(contentBriefs.format, "short_video"),
        eq(contentBriefs.status, "rendered"),
        gte(contentBriefs.renderedAt, start)
      )
    );
  return row?.n ?? 0;
}

async function nextDueBrief(format: (typeof FORMATS)[number]) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contentBriefs)
    .where(and(eq(contentBriefs.format, format), eq(contentBriefs.status, "pending"), lte(contentBriefs.scheduleAfter, new Date())))
    .orderBy(asc(contentBriefs.scheduleAfter))
    .limit(1);
  return row;
}

// instagram: no approved app exists as of this round (hit a real Meta
// "Profile Plus" platform gap, parked -- see facebook.ts's own comment)
// -- manual_post with the rendered asset itself as destination, which
// MarketingQueueCard already renders as a clickable download link
// (round 94's destination-link fix).
// pinterest/youtube/tiktok: auto_post -- a real poster is registered for
// each (gated on Peter's own credentials/authorization, same "poster
// exists, credentials might not yet" pattern as round 90's X/Threads).
// tiktok added round 91A follow-up (Sep 18) once a real TikTok developer
// app + Content Posting API integration existed.
// facebook: guardrails Section 0 -- community/group channels are always
// manual_post, no exception, regardless of whether a poster could exist.
const CHANNEL_MODE: Record<string, "auto_post" | "manual_post"> = {
  pinterest: "auto_post",
  youtube: "auto_post",
  tiktok: "auto_post",
  instagram: "manual_post",
  facebook: "manual_post",
};

async function createQueueItemsForBrief(
  briefId: string,
  brief: typeof contentBriefs.$inferSelect,
  assetUrl: string,
  guardrailNote: string
) {
  const db = getDb();
  const channels = brief.targetChannels.split(",").map((c) => c.trim()).filter(Boolean);
  for (const channel of channels) {
    const mode = CHANNEL_MODE[channel];
    if (!mode) continue; // an unrecognized channel in targetChannels is skipped, not guessed at
    await db
      .insert(marketingQueue)
      .values({
        channel: channel as (typeof marketingQueue.$inferInsert)["channel"],
        mode,
        destination: mode === "manual_post" ? assetUrl : "new post",
        draftText: `${brief.headline}\n\n${brief.bodyCopy}`,
        sourceCitations: brief.sources,
        mediaRefs: assetUrl,
        guardrailNotes: guardrailNote,
        locale: brief.locale,
        status: "pending",
      })
      .onConflictDoNothing({
        target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale],
      });
  }
}

export interface RenderResult {
  format: string;
  briefId: string | null;
  status: "rendered" | "skipped_no_brief" | "skipped_cap" | "failed";
  detail?: string;
}

export async function renderDueBriefs(): Promise<RenderResult[]> {
  const db = getDb();
  const results: RenderResult[] = [];

  for (const format of FORMATS) {
    if (format === "short_video") {
      const cap = await getGeminiVideoMonthlyCap();
      const renderedThisMonth = await videosRenderedThisMonth();
      if (renderedThisMonth >= cap) {
        results.push({ format, briefId: null, status: "skipped_cap", detail: `${renderedThisMonth}/${cap} videos this month` });
        continue;
      }
    }

    const brief = await nextDueBrief(format);
    if (!brief) {
      results.push({ format, briefId: null, status: "skipped_no_brief" });
      continue;
    }

    await db.update(contentBriefs).set({ status: "rendering" }).where(eq(contentBriefs.id, brief.id));

    try {
      let assetUrl: string;
      let guardrailNote: string;

      if (format === "short_video") {
        if (!brief.videoScript) throw new Error("short_video brief has no video_script.");
        const video = await generateVideo({ videoScript: brief.videoScript, locale: brief.locale });
        if (video.durationSeconds > SHORT_VIDEO_MAX_SECONDS) {
          throw new Error(`Rendered video is ${video.durationSeconds}s, over the ${SHORT_VIDEO_MAX_SECONDS}s cap.`);
        }
        assetUrl = await uploadMarketingAsset({
          pillar: brief.pillar,
          briefId: brief.id,
          fileName: "video.mp4",
          contentType: "video/mp4",
          data: video.buffer,
        });
        guardrailNote = `Generated via Veo (${video.durationSeconds}s, ~$${video.estimatedCostUsd.toFixed(2)} estimated cost). Sources: ${brief.sources}. Review for legibility/accuracy before approving.`;
      } else {
        const imageFormat = format as "pin" | "square_graphic" | "story";
        const image = await generateImage({
          imagePrompt: brief.imagePrompt,
          headline: brief.headline,
          format: imageFormat,
          locale: brief.locale,
          showTagline: true,
        });
        assetUrl = await uploadMarketingAsset({
          pillar: brief.pillar,
          briefId: brief.id,
          fileName: `${imageFormat}.png`,
          contentType: "image/png",
          data: image.buffer,
        });
        guardrailNote = `Generated via Gemini image model (${image.width}x${image.height}). Sources: ${brief.sources}. Review headline legibility before approving.`;
      }

      await db
        .update(contentBriefs)
        .set({ status: "rendered", renderedAssetUrl: assetUrl, renderedAt: new Date(), renderError: null })
        .where(eq(contentBriefs.id, brief.id));

      await createQueueItemsForBrief(brief.id, brief, assetUrl, guardrailNote);

      results.push({ format, briefId: brief.id, status: "rendered" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.update(contentBriefs).set({ status: "failed", renderError: message }).where(eq(contentBriefs.id, brief.id));
      results.push({ format, briefId: brief.id, status: "failed", detail: message });
    }
  }

  return results;
}
