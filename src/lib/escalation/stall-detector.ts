// CW-39, Part A — "stalled case" detector. Free on every tier, per the
// concept doc's decision: surfacing a real delay honestly shouldn't be
// paywalled, even though the escalation tools that follow it are.
//
// HONEST LIMITATION, Sep 6 2026: the concept doc calls for benchmarking
// against CW-33's per-office/per-form processing-time data. CW-33's table
// only has overall filing-to-completion percentiles, not a post-milestone
// (post-interview, post-ceremony-scheduled) breakdown — that's a
// genuinely different, finer-grained data CaseWhy doesn't have. Rather
// than fabricate a precise-looking per-office number this data can't
// actually support, this uses a single, clearly-labeled conservative
// threshold (90 days since a milestone) until real post-milestone timing
// data exists to benchmark against properly. Flagging this as a real gap,
// not a hidden approximation.

import type { CaseStatus } from "@/lib/uscis/client";

const MILESTONE_KEYWORDS = ["interview", "ceremony", "oath"];
const STALL_THRESHOLD_DAYS = 90;

export interface StallResult {
  isStalled: boolean;
  daysSinceLastUpdate: number;
  milestoneText: string | null;
}

export function detectStalledCase(status: CaseStatus): StallResult {
  if (status.history.length === 0) {
    return { isStalled: false, daysSinceLastUpdate: 0, milestoneText: null };
  }

  // history[0] is the most recent entry, matching the convention already
  // used in dashboard/page.tsx's history rendering (i === 0 gets the
  // highlighted timeline dot).
  const mostRecent = status.history[0];
  const daysSinceLastUpdate = Math.floor(
    (Date.now() - new Date(mostRecent.date).getTime()) / (24 * 60 * 60 * 1000)
  );

  const milestoneEntry = status.history.find((entry) =>
    MILESTONE_KEYWORDS.some((kw) => entry.completed_text_en.toLowerCase().includes(kw))
  );
  if (!milestoneEntry) {
    return { isStalled: false, daysSinceLastUpdate, milestoneText: null };
  }

  return {
    isStalled: daysSinceLastUpdate >= STALL_THRESHOLD_DAYS,
    daysSinceLastUpdate,
    milestoneText: milestoneEntry.completed_text_en,
  };
}
