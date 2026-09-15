// Round 73 (real) — generalizes round 85's poll-community into the
// marketing_queue. Reads target subreddits from community_source_configs
// (editable without a deploy, per the task doc's explicit instruction —
// unlike round 85's hardcoded TARGET_SUBREDDITS), adds the daily-cap and
// dedup checks the task doc asked for, and writes into marketing_queue
// (channel: "reddit" | "immigration_com") instead of the now-superseded
// pendingCommunityReplies.
//
// VisaJourney/Trackitt re-checked live before writing this (not assumed
// from round 85's finding): VisaJourney still 403s every request,
// Trackitt still doesn't respond at all. Same conclusion, freshly
// verified. Facebook/Quora have no read API — per the task doc, skip
// automated discovery entirely for those two; the channel enum values
// exist so a human-sourced draft can still be queued by hand.
//
// Reddit joined that manual-only list Sep 15: Reddit denied the
// Responsible Builder Policy application (ticket 18455163, generic
// non-compliance/insufficient-detail response) — no OAuth credentials are
// coming. The fallback, r/USCIS's Atom RSS feed (/r/USCIS/new.rss), was
// then live-tested from this deployed environment specifically (not just
// a local shell, which doesn't share Vercel's IP ranges): a clean 200
// locally, but a 403 challenge page then a 429 from Vercel — Reddit
// blocks this route's outbound IP range, not just unauthenticated JSON.
// See src/lib/community/reddit-client.ts's own updated comment for the
// full finding and the dormant OAuth code kept there for a post-launch
// reapplication (Peter's call: worth retrying once CaseWhy has real users
// and posting history to point to, not before).
//
// Same external-cron-hits-a-bearer-secured-route pattern as
// /api/cron/poll-aliases and /api/cron/check-status.

import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { fetchRssThreads, RSS_SOURCES } from "@/lib/community/rss-client";
import { classifyThread } from "@/lib/community/classify-thread";
import { draftMarketingReply } from "@/lib/marketing/draft-marketing-reply";
import { selfPromoNoteFor } from "@/lib/community/self-promo-notes";
import { isNearDuplicateDraft } from "@/lib/marketing/dedup";
import { LINKS_ENABLED, getDailyDraftCap } from "@/lib/marketing/config";

export const maxDuration = 60;
const TIME_BUDGET_MS = 45_000;
const MAX_CANDIDATES_PER_RUN = 12; // safety valve against a burst of new threads in one poll

interface Candidate {
  channel: "reddit" | "immigration_com";
  sourceName: string;
  destination: string;
  threadTitle: string;
  threadExcerpt: string;
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getDb();

  const candidates: Candidate[] = [];
  const sourceErrors: Array<{ source: string; message: string }> = [];

  // Reddit: no automated discovery path (OAuth denied, RSS blocked from
  // this deployed environment — see the file header comment). Manual-only,
  // same as Facebook/Quora — community_source_configs' reddit rows stay as
  // Peter's own reference list of subreddits worth checking by hand, not
  // read by this route.

  for (const rssSource of RSS_SOURCES) {
    try {
      const threads = await fetchRssThreads(rssSource);
      for (const t of threads) {
        candidates.push({
          channel: "immigration_com",
          sourceName: t.sourceName,
          destination: t.url,
          threadTitle: t.title,
          threadExcerpt: t.bodyText,
        });
      }
    } catch (err) {
      sourceErrors.push({ source: rssSource.name, message: err instanceof Error ? err.message : String(err) });
    }
  }

  // Daily cap (task doc: "default 5 drafts/day across all community
  // channels" — counts drafted rows only, not skipped/escalated, since
  // those don't cost Peter any review time.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [{ count: draftedToday }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(marketingQueue)
    .where(and(gte(marketingQueue.createdAt, todayStart), eq(marketingQueue.status, "pending")));

  const dailyDraftCap = await getDailyDraftCap();

  let drafted = 0;
  let escalated = 0;
  let skipped = 0;
  let alreadyQueued = 0;
  let dedupBlocked = 0;
  let capReached = draftedToday >= dailyDraftCap;
  let stoppedEarly = false;
  const classifyErrors: Array<{ destination: string; message: string }> = [];

  let processedThisRun = 0;
  for (const candidate of candidates) {
    if (Date.now() - startedAt >= TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    if (processedThisRun >= MAX_CANDIDATES_PER_RUN) {
      stoppedEarly = true;
      break;
    }

    const existing = await db
      .select({ id: marketingQueue.id })
      .from(marketingQueue)
      .where(and(eq(marketingQueue.channel, candidate.channel), eq(marketingQueue.destination, candidate.destination)))
      .limit(1);
    if (existing.length > 0) {
      alreadyQueued++;
      continue;
    }
    processedThisRun++;

    try {
      const hasPriorApproved = await db
        .select({ id: marketingQueue.id })
        .from(marketingQueue)
        .where(and(eq(marketingQueue.channel, candidate.channel), eq(marketingQueue.status, "approved")))
        .limit(1);
      const isFirstPostInCommunity = hasPriorApproved.length === 0;

      const outcome = await classifyThread({
        title: candidate.threadTitle,
        bodyText: candidate.threadExcerpt,
        isFirstPostInCommunity,
      });

      if (outcome.kind === "skip") {
        await db
          .insert(marketingQueue)
          .values({
            channel: candidate.channel,
            mode: "manual_post",
            destination: candidate.destination,
            guardrailNotes: `Not relevant: ${outcome.reason}`,
            status: "skipped",
          })
          .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination] });
        skipped++;
        continue;
      }

      if (outcome.kind === "escalate") {
        await db
          .insert(marketingQueue)
          .values({
            channel: candidate.channel,
            mode: "manual_post",
            destination: candidate.destination,
            guardrailNotes: `Escalated (Section 3): ${outcome.reason}`,
            status: "escalated",
          })
          .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination] });
        escalated++;
        continue;
      }

      // Daily cap only gates new drafted items, not skip/escalate —
      // those cost no review time and shouldn't be silently dropped just
      // because the drafting budget is spent for today.
      if (capReached) {
        continue;
      }

      const draft = await draftMarketingReply({
        title: candidate.threadTitle,
        bodyText: candidate.threadExcerpt,
        resourceType: outcome.resourceType,
        linksEnabled: LINKS_ENABLED,
      });

      if (!draft) {
        await db
          .insert(marketingQueue)
          .values({
            channel: candidate.channel,
            mode: "manual_post",
            destination: candidate.destination,
            guardrailNotes: `${outcome.reason} (but no draft could be grounded well in real data)`,
            status: "skipped",
          })
          .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination] });
        skipped++;
        continue;
      }

      if (await isNearDuplicateDraft(draft.draftText)) {
        await db
          .insert(marketingQueue)
          .values({
            channel: candidate.channel,
            mode: "manual_post",
            destination: candidate.destination,
            draftText: draft.draftText,
            guardrailNotes: "Near-duplicate of a draft from the last 30 days (Section 1) — not queued for review.",
            status: "skipped",
          })
          .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination] });
        dedupBlocked++;
        continue;
      }

      const guardrailNotes = [
        `Relevant: ${outcome.reason}`,
        `Checked against Sections 1-2.`,
        draft.mentionDropped ? "CaseWhy mention dropped after the answer-before-a-pitch test (Section 2)." : null,
        selfPromoNoteFor(candidate.sourceName),
      ]
        .filter(Boolean)
        .join(" ");

      await db
        .insert(marketingQueue)
        .values({
          channel: candidate.channel,
          mode: "manual_post",
          destination: candidate.destination,
          draftText: draft.draftText,
          sourceCitations: draft.sourceCitation,
          guardrailNotes,
          status: "pending",
        })
        .onConflictDoNothing({ target: [marketingQueue.channel, marketingQueue.destination] });
      drafted++;
      if (draftedToday + drafted >= dailyDraftCap) capReached = true;
    } catch (err) {
      classifyErrors.push({ destination: candidate.destination, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({
    redditAutomated: false,
    candidatesFound: candidates.length,
    drafted,
    escalated,
    skipped,
    alreadyQueued,
    dedupBlocked,
    capReached,
    sourceErrors,
    classifyErrors,
    stoppedEarly,
  });
}
