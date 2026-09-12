// Shared "check one tracked case now" logic — the same status-fetch +
// change-detection + notification-email + lastStatusText/lastCheckedAt
// update the cron job (src/app/api/cron/check-status/route.ts) does per
// row, extracted so CW-37's on-demand "check now" action can reuse it
// exactly rather than drift from the cron's behavior over time.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { trackedCases, caseStatusHistory } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { getCaseStatus, type CaseStatus } from "@/lib/uscis/client";
import { sendStatusChangeEmail } from "@/lib/email/postmark";
import { getStatusChangeEmailsEnabled } from "@/lib/settings/settings";
import { sendPushToUser } from "@/lib/push/send";
import { MILESTONE_KEYWORDS } from "@/lib/escalation/stall-detector";

export interface TrackedCaseRow {
  id: string;
  userId: string;
  receiptNumber: string; // encrypted
  email: string; // encrypted
  lastStatusText: string | null; // encrypted
  /** One of CASE_TYPES' ids, or null for a case tracked before round 21. */
  caseType?: string | null;
}

/**
 * Round 71 — writes every real history entry USCIS's own response contains
 * into case_status_history, not just the single entry the cron's own
 * before/after diff happens to detect as "new." Safe to call on every check
 * (including the very first one right after tracking, where previously no
 * history existed yet at all) — dedup is enforced by the table's own
 * (trackedCaseId, statusText, eventDate) unique constraint via
 * onConflictDoNothing, not by any caller-side "have I seen this" tracking.
 *
 * Called from two places: the dashboard's own live server-render (so a
 * freshly-tracked case gets backfilled the moment its owner looks at it,
 * without waiting for the next cron run), and checkTrackedCaseNow() (the
 * cron + Plus's on-demand check) — both paths already have a real
 * `CaseStatus` in hand, this just persists it.
 */
export async function recordCaseHistory(
  trackedCaseId: string,
  caseType: string | null | undefined,
  receiptNumber: string,
  status: CaseStatus
): Promise<void> {
  const db = getDb();
  const servicePrefix = receiptNumber.slice(0, 3);
  const filingDate = status.submittedDate ? new Date(status.submittedDate) : null;

  const rows: (typeof caseStatusHistory.$inferInsert)[] = [];

  // The live current status — this is the only row that can carry a real
  // statusDescription, since hist_case_status entries don't include one.
  rows.push({
    trackedCaseId,
    caseType: caseType ?? null,
    servicePrefix,
    statusText: status.statusText,
    statusDescription: status.statusDescription,
    eventDate: status.modifiedDate ? new Date(status.modifiedDate) : null,
    filingDate,
    milestoneDate: MILESTONE_KEYWORDS.some((kw) => status.statusText.toLowerCase().includes(kw))
      ? status.modifiedDate
        ? new Date(status.modifiedDate)
        : new Date()
      : null,
    source: "current_status",
  });

  // Every entry USCIS's own history array contains, not just whichever one
  // the diff happened to flag as new.
  for (const entry of status.history) {
    rows.push({
      trackedCaseId,
      caseType: caseType ?? null,
      servicePrefix,
      statusText: entry.completed_text_en,
      statusDescription: null,
      eventDate: new Date(entry.date),
      filingDate,
      milestoneDate: MILESTONE_KEYWORDS.some((kw) => entry.completed_text_en.toLowerCase().includes(kw))
        ? new Date(entry.date)
        : null,
      source: "history_sync",
    });
  }

  // Insert the current-status row first (per row, one at a time, so the
  // richer row — the one with a real statusDescription — always wins the
  // unique-constraint race if a historical entry happens to share the same
  // (statusText, eventDate) key) — then the rest, all deduped the same way.
  for (const row of rows) {
    await db.insert(caseStatusHistory).values(row).onConflictDoNothing();
  }
}

export async function checkTrackedCaseNow(
  row: TrackedCaseRow
): Promise<{ status: CaseStatus; notified: boolean }> {
  const receiptNumber = decryptField(row.receiptNumber);
  const email = decryptField(row.email);
  const previousStatusText = row.lastStatusText ? decryptField(row.lastStatusText) : null;

  const status = await getCaseStatus(receiptNumber);
  let notified = false;
  const db = getDb();

  if (previousStatusText !== null && previousStatusText !== status.statusText) {
    if (await getStatusChangeEmailsEnabled(row.userId)) {
      await sendStatusChangeEmail({
        to: email,
        receiptNumber,
        statusText: status.statusText,
        statusDescription: status.statusDescription,
      });
      notified = true;
    }
    // Round 26 — same first-check gate as the email above (previousStatusText
    // !== null), for the same reason: don't notify on the very first check
    // after tracking, only on a real change. A user with zero subscribed
    // devices just gets an empty Promise.all — no separate "is push on" flag
    // to check first.
    await sendPushToUser(row.userId, {
      title: `${status.formType} — ${status.statusText}`,
      body: status.statusDescription,
      url: `/dashboard?receipt=${encodeURIComponent(receiptNumber)}`,
    });
  }

  // Round 71 — history recording is no longer gated on "did the status
  // change": it now runs on every check, including the very first one,
  // since that's the only way a case tracked mid-process ever gets its
  // real prior history backfilled. Safe to call unconditionally — the
  // table's own unique constraint no-ops anything already recorded.
  await recordCaseHistory(row.id, row.caseType, receiptNumber, status);

  await db
    .update(trackedCases)
    .set({ lastStatusText: encryptField(status.statusText), lastCheckedAt: new Date() })
    .where(eq(trackedCases.id, row.id));

  return { status, notified };
}
