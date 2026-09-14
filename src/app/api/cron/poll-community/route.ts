// Round 85 — polls the in-scope community sources (Reddit via OAuth, once
// configured; immigration.com's RSS feed, working now), classifies each
// new thread, and queues a draft/escalation/skip row in
// pendingCommunityReplies. Never posts anything anywhere — see
// SOCIAL_MEDIA_GUARDRAILS.md Section 0 and schema.ts's own comment on this
// table. Same external-cron-hits-a-bearer-secured-route pattern as
// /api/cron/poll-aliases and /api/cron/check-status.
//
// Target ~8-10 candidate threads/day total per the task doc, tunable once
// real signal-to-noise is visible — TARGET_SUBREDDITS/RSS_SOURCES and the
// per-run cap below are where to adjust that, not a config table, since
// this is a small fixed list unlike round 70's per-alias config (which
// genuinely needed to be editable without a deploy).

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { pendingCommunityReplies } from "@/lib/db/schema";
import { fetchNewThreads, isRedditConfigured } from "@/lib/community/reddit-client";
import { fetchRssThreads, RSS_SOURCES } from "@/lib/community/rss-client";
import { classifyThread } from "@/lib/community/classify-thread";
import { draftCommunityReply } from "@/lib/community/draft-reply";
import { selfPromoNoteFor } from "@/lib/community/self-promo-notes";

export const maxDuration = 60;
const TIME_BUDGET_MS = 45_000;

// r/immigrationlaw and form-specific subreddits deliberately left out of
// this first pass -- start with the two named, highest-traffic subs per
// the task doc's own "start here" framing; add more once real
// signal-to-noise from these two is visible.
const TARGET_SUBREDDITS = ["USCIS", "immigration"];

const MAX_CANDIDATES_PER_RUN = 12; // safety valve against a burst of new threads in one poll

interface Candidate {
  source: "reddit" | "rss";
  sourceName: string;
  threadUrl: string;
  threadTitle: string;
  threadExcerpt: string;
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getDb();

  const candidates: Candidate[] = [];
  const sourceErrors: Array<{ source: string; message: string }> = [];

  if (isRedditConfigured()) {
    for (const subreddit of TARGET_SUBREDDITS) {
      try {
        const threads = await fetchNewThreads(subreddit);
        for (const t of threads) {
          candidates.push({
            source: "reddit",
            sourceName: `r/${t.subreddit}`,
            threadUrl: t.url,
            threadTitle: t.title,
            threadExcerpt: t.bodyText.slice(0, 2000),
          });
        }
      } catch (err) {
        sourceErrors.push({ source: `r/${subreddit}`, message: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  for (const rssSource of RSS_SOURCES) {
    try {
      const threads = await fetchRssThreads(rssSource);
      for (const t of threads) {
        candidates.push({
          source: "rss",
          sourceName: t.sourceName,
          threadUrl: t.url,
          threadTitle: t.title,
          threadExcerpt: t.bodyText,
        });
      }
    } catch (err) {
      sourceErrors.push({ source: rssSource.name, message: err instanceof Error ? err.message : String(err) });
    }
  }

  let drafted = 0;
  let escalated = 0;
  let skipped = 0;
  let alreadyQueued = 0;
  let stoppedEarly = false;
  const classifyErrors: Array<{ threadUrl: string; message: string }> = [];

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
      .select({ id: pendingCommunityReplies.id })
      .from(pendingCommunityReplies)
      .where(eq(pendingCommunityReplies.threadUrl, candidate.threadUrl))
      .limit(1);
    if (existing.length > 0) {
      alreadyQueued++;
      continue;
    }
    processedThisRun++;

    try {
      const hasPriorApproved = await db
        .select({ id: pendingCommunityReplies.id })
        .from(pendingCommunityReplies)
        .where(
          and(eq(pendingCommunityReplies.sourceName, candidate.sourceName), eq(pendingCommunityReplies.status, "approved"))
        )
        .limit(1);
      const isFirstPostInCommunity = hasPriorApproved.length === 0;

      const outcome = await classifyThread({
        title: candidate.threadTitle,
        bodyText: candidate.threadExcerpt,
        isFirstPostInCommunity,
      });

      if (outcome.kind === "skip") {
        await db
          .insert(pendingCommunityReplies)
          .values({
            source: candidate.source,
            sourceName: candidate.sourceName,
            threadUrl: candidate.threadUrl,
            threadTitle: candidate.threadTitle,
            threadExcerpt: candidate.threadExcerpt,
            relevanceReason: outcome.reason,
            status: "skipped",
          })
          .onConflictDoNothing({ target: pendingCommunityReplies.threadUrl });
        skipped++;
        continue;
      }

      if (outcome.kind === "escalate") {
        await db
          .insert(pendingCommunityReplies)
          .values({
            source: candidate.source,
            sourceName: candidate.sourceName,
            threadUrl: candidate.threadUrl,
            threadTitle: candidate.threadTitle,
            threadExcerpt: candidate.threadExcerpt,
            relevanceReason: outcome.reason,
            escalationReason: outcome.reason,
            status: "pending",
          })
          .onConflictDoNothing({ target: pendingCommunityReplies.threadUrl });
        escalated++;
        continue;
      }

      const draft = await draftCommunityReply({
        title: candidate.threadTitle,
        bodyText: candidate.threadExcerpt,
        resourceType: outcome.resourceType,
      });

      if (!draft) {
        // The drafting model itself judged it couldn't answer well from
        // real data, even though the classifier thought it looked
        // relevant -- treat as skipped, not an error.
        await db
          .insert(pendingCommunityReplies)
          .values({
            source: candidate.source,
            sourceName: candidate.sourceName,
            threadUrl: candidate.threadUrl,
            threadTitle: candidate.threadTitle,
            threadExcerpt: candidate.threadExcerpt,
            relevanceReason: `${outcome.reason} (but no draft could be grounded well in real data)`,
            status: "skipped",
          })
          .onConflictDoNothing({ target: pendingCommunityReplies.threadUrl });
        skipped++;
        continue;
      }

      await db
        .insert(pendingCommunityReplies)
        .values({
          source: candidate.source,
          sourceName: candidate.sourceName,
          threadUrl: candidate.threadUrl,
          threadTitle: candidate.threadTitle,
          threadExcerpt: candidate.threadExcerpt,
          relevanceReason: outcome.reason,
          draftReply: draft.draftReply,
          sourceCitation: draft.sourceCitation,
          selfPromoNote: selfPromoNoteFor(candidate.sourceName),
          status: "pending",
        })
        .onConflictDoNothing({ target: pendingCommunityReplies.threadUrl });
      drafted++;
    } catch (err) {
      classifyErrors.push({ threadUrl: candidate.threadUrl, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({
    redditConfigured: isRedditConfigured(),
    candidatesFound: candidates.length,
    drafted,
    escalated,
    skipped,
    alreadyQueued,
    sourceErrors,
    classifyErrors,
    stoppedEarly,
  });
}
