// Shared "check one tracked case now" logic — the same status-fetch +
// change-detection + notification-email + lastStatusText/lastCheckedAt
// update the cron job (src/app/api/cron/check-status/route.ts) does per
// row, extracted so CW-37's on-demand "check now" action can reuse it
// exactly rather than drift from the cron's behavior over time.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { getCaseStatus, type CaseStatus } from "@/lib/uscis/client";
import { sendStatusChangeEmail } from "@/lib/email/postmark";

export interface TrackedCaseRow {
  id: string;
  receiptNumber: string; // encrypted
  email: string; // encrypted
  lastStatusText: string | null; // encrypted
}

export async function checkTrackedCaseNow(
  row: TrackedCaseRow
): Promise<{ status: CaseStatus; notified: boolean }> {
  const receiptNumber = decryptField(row.receiptNumber);
  const email = decryptField(row.email);
  const previousStatusText = row.lastStatusText ? decryptField(row.lastStatusText) : null;

  const status = await getCaseStatus(receiptNumber);
  let notified = false;

  if (previousStatusText !== null && previousStatusText !== status.statusText) {
    await sendStatusChangeEmail({
      to: email,
      receiptNumber,
      statusText: status.statusText,
      statusDescription: status.statusDescription,
    });
    notified = true;
  }

  const db = getDb();
  await db
    .update(trackedCases)
    .set({ lastStatusText: encryptField(status.statusText), lastCheckedAt: new Date() })
    .where(eq(trackedCases.id, row.id));

  return { status, notified };
}
