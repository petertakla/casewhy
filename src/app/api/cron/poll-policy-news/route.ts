// Round 90 — policy/news watcher: polls src/lib/marketing/news-watcher/
// sources, stores every new item in news_items (dedupe by URL, a real DB
// unique constraint, plus a title-hash check for the same story appearing
// at two different URLs), and drafts one marketing_queue row per owned
// channel (x, threads, facebook -- facebook added round 90 follow-up,
// Sep 18) for anything not already processed. Same bearer-secured-cron
// pattern as poll-marketing-sources/poll-aliases (isAuthorizedCronRequest,
// GitHub Actions + ADMIN_DIAG_SECRET both accepted).
//
// mode: "auto_post" for every row this route creates -- x/threads/
// facebook (the Page, not Facebook groups) are owned channels, per
// SOCIAL_MEDIA_GUARDRAILS.md Section 0. Nothing posts without a real
// approval click in /admin/marketing, and while
// marketingSettings.socialPostingEnabled is off (round 90 prep follow-up
// master switch), not even that click actually posts -- see
// approveForAutoPost's own comment (src/app/admin/marketing/actions.ts).
//
// English-only unless marketingSettings.spanishSocialEnabled is on
// (Peter's Sep 15 decision, task doc Section 4) -- draftXThread/
// draftThreadsPost are called a second time with locale "es" only when
// that flag is set, and the resulting rows get locale: "es" (the schema's
// own (channel, destination, locale) unique constraint is exactly what
// makes a second, same-destination Spanish row possible without colliding
// with the English one).

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { marketingQueue, newsItems } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { fetchWatcherItems } from "@/lib/marketing/news-watcher/fetch-watcher-items";
import { matchKbMemoIds } from "@/lib/marketing/news-watcher/kb-match";
import { staleVisaBulletinDestination } from "@/lib/marketing/news-watcher/visa-bulletin-check";
import { draftXThread, draftThreadsPost, draftFacebookPost, type DraftLocale } from "@/lib/marketing/draft-news-post";
import { getSpanishSocialEnabled } from "@/lib/marketing/config";
import { ensureEvergreenForDate } from "@/lib/marketing/evergreen/generate-weekday-evergreen";
import { createHash } from "crypto";

export const maxDuration = 60;
const TIME_BUDGET_MS = 45_000;
const MAX_ITEMS_PER_RUN = 8; // safety valve; each item costs up to 4 model calls (x/threads x en/es)

function titleHashOf(title: string): string {
  return createHash("sha1")
    .update(title.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex");
}

async function draftAndQueue(
  db: ReturnType<typeof getDb>,
  item: { url: string; title: string; rawSummary: string; sourceName: string },
  locale: DraftLocale
): Promise<"drafted" | "escalated"> {
  const [xDraft, threadsDraft, facebookDraft] = await Promise.all([
    draftXThread(item, locale),
    draftThreadsPost(item, locale),
    draftFacebookPost(item, locale),
  ]);

  let anyDrafted = false;

  if (xDraft) {
    anyDrafted = true;
    await db
      .insert(marketingQueue)
      .values({
        channel: "x",
        mode: "auto_post",
        destination: item.url,
        draftText: xDraft.posts.join("\n\n---\n\n"),
        sourceCitations: `${item.sourceName} — ${item.url}`,
        guardrailNotes: `Sourced directly from ${item.sourceName} (Section 4: LinkedIn/X/Threads). Thread posts are separated by "---" on their own line -- edit within a post's own section, keep the separators if you keep the thread structure.`,
        locale,
        status: "pending",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  } else {
    await db
      .insert(marketingQueue)
      .values({
        channel: "x",
        mode: "auto_post",
        destination: item.url,
        guardrailNotes: `Escalated (Section 4, sourcing over speed): the source material wasn't enough to draft a substantive, accurate thread.`,
        locale,
        status: "escalated",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  }

  if (threadsDraft) {
    anyDrafted = true;
    await db
      .insert(marketingQueue)
      .values({
        channel: "threads",
        mode: "auto_post",
        destination: item.url,
        draftText: threadsDraft.posts[0],
        sourceCitations: `${item.sourceName} — ${item.url}`,
        guardrailNotes: `Sourced directly from ${item.sourceName} (Section 4: LinkedIn/X/Threads).`,
        locale,
        status: "pending",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  } else {
    await db
      .insert(marketingQueue)
      .values({
        channel: "threads",
        mode: "auto_post",
        destination: item.url,
        guardrailNotes: `Escalated (Section 4, sourcing over speed): the source material wasn't enough to draft a substantive, accurate post.`,
        locale,
        status: "escalated",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  }

  // Round 90 follow-up (Sep 18) — Facebook Page, same auto_post shape as
  // x/threads above. Facebook *group* posts (a different set of rows,
  // created elsewhere with mode "manual_post") are unaffected -- this
  // only ever creates Page-post rows.
  if (facebookDraft) {
    anyDrafted = true;
    await db
      .insert(marketingQueue)
      .values({
        channel: "facebook",
        mode: "auto_post",
        destination: item.url,
        draftText: facebookDraft.posts[0],
        sourceCitations: `${item.sourceName} — ${item.url}`,
        guardrailNotes: `Sourced directly from ${item.sourceName} (Section 4: LinkedIn/X/Threads). Posts to the CaseWhy Facebook Page.`,
        locale,
        status: "pending",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  } else {
    await db
      .insert(marketingQueue)
      .values({
        channel: "facebook",
        mode: "auto_post",
        destination: item.url,
        guardrailNotes: `Escalated (Section 4, sourcing over speed): the source material wasn't enough to draft a substantive, accurate post.`,
        locale,
        status: "escalated",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] });
  }

  return anyDrafted ? "drafted" : "escalated";
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getDb();

  const spanishEnabled = await getSpanishSocialEnabled();

  const { items, sourceErrors } = await fetchWatcherItems();

  let newItemsFound = 0;
  let alreadySeen = 0;
  let drafted = 0;
  let escalated = 0;
  let stoppedEarly = false;
  const draftErrors: Array<{ url: string; message: string }> = [];

  // Insert any genuinely new item first (cheap, no model calls) so a
  // later time-budget cutoff during drafting still leaves every item
  // recorded for the next poll to pick up via the processedAt IS NULL scan
  // below, rather than losing it entirely.
  for (const item of items) {
    const existingByUrl = await db.select({ id: newsItems.id }).from(newsItems).where(eq(newsItems.url, item.url)).limit(1);
    if (existingByUrl.length > 0) {
      alreadySeen++;
      continue;
    }
    const titleHash = titleHashOf(item.title);
    const existingByTitle = await db.select({ id: newsItems.id }).from(newsItems).where(eq(newsItems.titleHash, titleHash)).limit(1);
    if (existingByTitle.length > 0) {
      alreadySeen++;
      continue;
    }

    await db.insert(newsItems).values({
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      url: item.url,
      title: item.title,
      titleHash,
      rawSummary: item.rawSummary || null,
      publishedAt: item.publishedAt,
      kbRelatedMemoIds: matchKbMemoIds(item.title, item.rawSummary).join("; ") || null,
    });
    newItemsFound++;
  }

  // Draft for anything not yet processed (this run's new items, plus any
  // left over from a prior run that hit its own time budget).
  const unprocessed = await db
    .select()
    .from(newsItems)
    .where(sql`${newsItems.processedAt} IS NULL`)
    .limit(MAX_ITEMS_PER_RUN);

  for (const row of unprocessed) {
    if (Date.now() - startedAt >= TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    try {
      const itemInput = { url: row.url, title: row.title, rawSummary: row.rawSummary ?? "", sourceName: row.sourceName };
      const enOutcome = await draftAndQueue(db, itemInput, "en");
      if (enOutcome === "drafted") drafted++;
      else escalated++;

      if (spanishEnabled) {
        const esOutcome = await draftAndQueue(db, itemInput, "es");
        if (esOutcome === "drafted") drafted++;
        else escalated++;
      }

      await db.update(newsItems).set({ processedAt: new Date() }).where(eq(newsItems.id, row.id));
    } catch (err) {
      draftErrors.push({ url: row.url, message: err instanceof Error ? err.message : String(err) });
    }
  }

  // Visa Bulletin monthly-refresh flag -- pure date check, no network call,
  // reuses the existing marketing_queue dedupe (onConflictDoNothing) so it
  // only ever queues once per stale month, not once per poll.
  const staleDestination = staleVisaBulletinDestination();
  let visaBulletinFlagged = false;
  if (staleDestination) {
    const result = await db
      .insert(marketingQueue)
      .values({
        channel: "outreach",
        mode: "manual_post",
        destination: staleDestination,
        guardrailNotes:
          "KB refresh needed: kb/visa-bulletin.ts's hand-captured snapshot is for a prior month. Not a social post -- refresh that file from the real bulletin at VISA_BULLETIN_SOURCE_URL, then this item can be dismissed.",
        status: "escalated",
      })
      .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination, marketingQueue.locale] })
      .returning({ id: marketingQueue.id });
    visaBulletinFlagged = result.length > 0;
  }

  // Anything left unprocessed after this run's cutoff.
  const [{ count: stillUnprocessed }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(newsItems)
    .where(sql`${newsItems.processedAt} IS NULL`);

  // Round 116 — evergreen weekday fallback. Runs after the real-news
  // drafting above so its own "did real news already post today" check
  // (Mon/Thu only) sees this run's own inserts, not just a prior run's.
  const evergreen = await ensureEvergreenForDate(db, new Date());

  return Response.json({
    itemsFound: items.length,
    newItemsFound,
    alreadySeen,
    drafted,
    escalated,
    stillUnprocessed,
    visaBulletinFlagged,
    spanishEnabled,
    sourceErrors,
    draftErrors,
    stoppedEarly,
    evergreen,
  });
}
