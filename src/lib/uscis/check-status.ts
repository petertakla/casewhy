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

    // Round 69, Part 2 — one row per real detected change, same gate as the
    // notifications above (never on the first check). Only the receipt
    // number's 3-letter service-center prefix is stored, not the full
    // number a second time.
    const milestoneEntry = status.history.find((entry) =>
      MILESTONE_KEYWORDS.some((kw) => entry.completed_text_en.toLowerCase().includes(kw))
    );
    await db.insert(caseStatusHistory).values({
      trackedCaseId: row.id,
      caseType: row.caseType ?? null,
      servicePrefix: receiptNumber.slice(0, 3),
      statusText: status.statusText,
      milestoneDate: milestoneEntry ? new Date(milestoneEntry.date) : null,
    });
  }

  await db
    .update(trackedCases)
    .set({ lastStatusText: encryptField(status.statusText), lastCheckedAt: new Date() })
    .where(eq(trackedCases.id, row.id));

  return { status, notified };
}
