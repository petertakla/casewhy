// Round 116 — evergreen weekday fallback: guarantees every weekday has
// something ready for the queue regardless of news flow, drawn entirely
// from content this codebase already maintains (never invented). See
// generate-weekday-evergreen.ts for the orchestration; this file is only
// the per-weekday topic content.

import { and, eq, gte, lt, ne, or, isNull } from "drizzle-orm";
import type { getDb } from "@/lib/db/client";
import { marketingQueue, newsItems } from "@/lib/db/schema";
import type { EvergreenItemInput } from "../draft-evergreen-post";
import { VISA_BULLETIN_MONTH, VISA_BULLETIN_SOURCE_URL, FAMILY_FINAL_ACTION, EMPLOYMENT_FINAL_ACTION, bulletinDateLabel } from "@/lib/kb/visa-bulletin";
import { PROCESSING_TIMES, PROCESSING_TIMES_SOURCE_URL } from "@/lib/kb/processing-times";
import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { FAQ_SEARCH_ENTRIES } from "@/lib/search/faq-search-data";

export type EvergreenType = "visa-bulletin" | "faq-explainer" | "processing-time" | "policy-memo";

// ISO weekday (1=Mon .. 5=Fri). Friday (5) is the recap -- built from the
// week's own history, not a fixed KB topic, so it isn't in this map.
export const WEEKDAY_EVERGREEN_TYPE: Record<number, EvergreenType> = {
  1: "visa-bulletin",
  2: "faq-explainer",
  3: "processing-time",
  4: "policy-memo",
};

// Only Monday/Thursday are "real news if available, else this" per the
// round 116 task doc -- Tuesday/Wednesday always run their own evergreen
// topic regardless of what the news watcher found that day.
export const NEWS_AWARE_WEEKDAYS = new Set([1, 4]);

export function buildVisaBulletinTopic(): EvergreenItemInput {
  const f2a = FAMILY_FINAL_ACTION.find((r) => r.category === "F2A")!;
  const eb2 = EMPLOYMENT_FINAL_ACTION.find((r) => r.category === "EB-2")!;
  const eb3 = EMPLOYMENT_FINAL_ACTION.find((r) => r.category === "EB-3")!;
  const facts = `Visa Bulletin Final Action Dates for ${VISA_BULLETIN_MONTH} (Dept. of State) -- these are the dates that actually determine when a green card can be issued, not the earlier "dates for filing" chart:
- Family F2A (spouses/children of permanent residents): ${bulletinDateLabel(f2a.allOther)} for most countries, ${bulletinDateLabel(f2a.mexico!)} for Mexico.
- Employment EB-2 (advanced degrees/exceptional ability): ${bulletinDateLabel(eb2.allOther)} for most countries, ${bulletinDateLabel(eb2.india!)} for India, ${bulletinDateLabel(eb2.china!)} for China.
- Employment EB-3 (skilled workers/professionals): ${bulletinDateLabel(eb3.allOther)} for most countries, ${bulletinDateLabel(eb3.china!)} for China, ${bulletinDateLabel(eb3.india!)} for India.
"Current" means no wait once the other requirements are met; "Unavailable" means no visas are currently being issued in that category at all.`;
  return {
    title: `Where the Visa Bulletin's Final Action Dates stand for ${VISA_BULLETIN_MONTH}`,
    facts,
    sourceName: "U.S. Department of State, Visa Bulletin",
    sourceUrl: VISA_BULLETIN_SOURCE_URL,
  };
}

export function buildFaqExplainerTopic(): EvergreenItemInput {
  const entry = FAQ_SEARCH_ENTRIES.find((e) => e.question.startsWith('What does "Case Was Received"'))!;
  const facts = `A common point of confusion: ${entry.snippet} Receiving that initial status is not, by itself, evidence of a delay -- a case is only "outside normal processing time" once it has waited longer than the range USCIS itself currently publishes for that specific form and office.`;
  return {
    title: `What "Case Was Received" actually means -- and when a case counts as delayed`,
    facts,
    sourceName: "USCIS Check Case Processing Times",
    sourceUrl: PROCESSING_TIMES_SOURCE_URL,
  };
}

export function buildProcessingTimeTopic(): EvergreenItemInput {
  const entry = PROCESSING_TIMES.find((e) => e.id === "i751-removing-conditions")!;
  const facts = `USCIS's own Check Case Processing Times tool (as of ${entry.asOf}) shows the 80th-percentile processing time for Form ${entry.formType} (${entry.categoryLabel}, adjudicated by ${entry.office}) at ${entry.percentile80Months} months. That means roughly 1 in 5 cases in this category is taking even longer than that. This is USCIS's own published figure, not an estimate.`;
  return {
    title: `How long is Form I-751 actually taking right now?`,
    facts,
    sourceName: "USCIS Check Case Processing Times",
    sourceUrl: PROCESSING_TIMES_SOURCE_URL,
  };
}

export function buildPolicyMemoTopic(): EvergreenItemInput {
  const memo = findPolicyMemoById("public-charge-2026")!;
  return {
    title: memo.title,
    facts: `${memo.summary} Current status: ${memo.currentStatus}`,
    sourceName: memo.sourceTitle,
    sourceUrl: memo.sourceUrl,
  };
}

export function buildTopicForType(type: EvergreenType): EvergreenItemInput {
  switch (type) {
    case "visa-bulletin":
      return buildVisaBulletinTopic();
    case "faq-explainer":
      return buildFaqExplainerTopic();
    case "processing-time":
      return buildProcessingTimeTopic();
    case "policy-memo":
      return buildPolicyMemoTopic();
  }
}

const EVERGREEN_TYPE_LABEL: Record<EvergreenType, string> = {
  "visa-bulletin": "this month's Visa Bulletin Final Action Dates",
  "faq-explainer": 'what "Case Was Received" actually means',
  "processing-time": "how long Form I-751 is actually taking right now",
  "policy-memo": "the new public-charge guidance that took effect this week",
};

function mondayOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // 1=Mon..7=Sun
  d.setUTCDate(d.getUTCDate() - (isoDay - 1));
  return d;
}

/**
 * Friday recap topic, built from what actually got queued Mon-Thu this
 * week (not re-derived from the fixed weekday map) -- so it's honest
 * about whether a given day actually ran its evergreen fallback or got
 * preempted by real news. Returns null if nothing was queued yet (e.g.
 * a brand new week with no prior days processed).
 */
export async function buildRecapTopic(db: ReturnType<typeof getDb>, fridayDate: Date): Promise<EvergreenItemInput | null> {
  const weekStart = mondayOfWeek(fridayDate);
  // A row's "which day this belongs to" is scheduledFor when set (the
  // evergreen fallback -- which may have been queued well before its own
  // target date, e.g. a whole week backfilled ahead of time for one
  // Sunday-evening review) or createdAt otherwise (real news, always
  // drafted same-day in real time by the reactive watcher, never
  // scheduled for later). Filtering on createdAt alone would miss every
  // backfilled evergreen row entirely, since its real insert time has
  // nothing to do with the date it's scheduled for.
  const rows = await db
    .select({ destination: marketingQueue.destination })
    .from(marketingQueue)
    .where(
      and(
        eq(marketingQueue.channel, "x"),
        eq(marketingQueue.mode, "auto_post"),
        ne(marketingQueue.status, "escalated"),
        or(
          and(isNull(marketingQueue.scheduledFor), gte(marketingQueue.createdAt, weekStart), lt(marketingQueue.createdAt, fridayDate)),
          and(gte(marketingQueue.scheduledFor, weekStart), lt(marketingQueue.scheduledFor, fridayDate))
        )
      )
    );

  if (rows.length === 0) return null;

  const topics: string[] = [];
  for (const row of rows) {
    if (row.destination.startsWith("evergreen:")) {
      const type = row.destination.split(":")[1] as EvergreenType;
      const label = EVERGREEN_TYPE_LABEL[type];
      if (label && !topics.includes(label)) topics.push(label);
    } else {
      const [newsRow] = await db.select({ title: newsItems.title }).from(newsItems).where(eq(newsItems.url, row.destination)).limit(1);
      if (newsRow && !topics.includes(newsRow.title)) topics.push(newsRow.title);
    }
  }
  if (topics.length === 0) return null;

  return {
    title: "This week's recap",
    facts: `This week's topics, in the order they were covered:\n${topics.map((t) => `- ${t}`).join("\n")}`,
    sourceName: "CaseWhy weekly recap",
    // No sourceUrl -- this summarizes CaseWhy's own week of posts, not an
    // external primary source.
    isRecap: true,
  };
}
