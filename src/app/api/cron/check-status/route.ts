// Status-change polling job. Triggered by an external scheduler (cron-job.org,
// not Vercel's own cron — see CLOUD_CLAUDE.md for why), never by a browser.
// Auth: `Authorization: Bearer <CRON_SECRET>` — note the literal "Bearer "
// prefix is required; a bare token gets treated as "no header at all" by
// most HTTP clients if misconfigured, a mistake that's bitten this pattern
// before (see the NVDA project's cron-job.org notes).

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { sendStatusChangeEmail } from "@/lib/email/postmark";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db.select().from(trackedCases);

  let checked = 0;
  let notified = 0;
  const errors: Array<{ id: string; message: string }> = [];

  for (const row of rows) {
    try {
      const receiptNumber = decryptField(row.receiptNumber);
      const email = decryptField(row.email);
      const previousStatusText = row.lastStatusText ? decryptField(row.lastStatusText) : null;

      const status = await getCaseStatus(receiptNumber);
      checked++;

      if (previousStatusText !== null && previousStatusText !== status.statusText) {
        await sendStatusChangeEmail({
          to: email,
          receiptNumber,
          statusText: status.statusText,
          statusDescription: status.statusDescription,
        });
        notified++;
      }

      await db
        .update(trackedCases)
        .set({
          lastStatusText: encryptField(status.statusText),
          lastCheckedAt: new Date(),
        })
        .where(eq(trackedCases.id, row.id));
    } catch (err) {
      const message =
        err instanceof UscisApiError
          ? `USCIS ${err.status}: ${err.detail}`
          : err instanceof Error
            ? err.message
            : String(err);
      errors.push({ id: row.id, message });
    }
  }

  return Response.json({ checked, notified, errors });
}
