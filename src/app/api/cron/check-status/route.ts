// Status-change polling job. Triggered by an external scheduler (cron-job.org,
// not Vercel's own cron — see CLOUD_CLAUDE.md for why), never by a browser.
// Auth: `Authorization: Bearer <CRON_SECRET>` — note the literal "Bearer "
// prefix is required; a bare token gets treated as "no header at all" by
// most HTTP clients if misconfigured, a mistake that's bitten this pattern
// before (see the NVDA project's cron-job.org notes).
//
// Round 56 — real numbers checked before changing anything (Sep 10):
// `tracked_cases` has 2 active rows in production today; a single
// getCaseStatus() call runs ~100-600ms (the high end is a fresh OAuth
// token fetch, cached per-invocation after that); this route had no
// `maxDuration` set anywhere, and the sequential loop had no time-budget
// check at all — a hard kill mid-run would just drop the response with no
// partial-completion signal. Not a real risk at today's 2 rows, but a real
// gap as tracked_cases grows. Fix: explicit maxDuration, a time-budget
// check that stops cleanly (not killed) and reports how much is left, and
// ordering by staleness (oldest-checked-first, nulls first for never-
// checked rows) so a stopped-early run can never permanently starve the
// same rows — every full daily run re-scans the whole active set (no
// resume-offset state), so whatever didn't fit this run naturally lands
// at the front of the next one.

import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { UscisApiError } from "@/lib/uscis/client";
import { checkTrackedCaseNow } from "@/lib/uscis/check-status";

export const maxDuration = 60;
// Leaves real margin under maxDuration for the in-flight row and the
// response itself to finish before Vercel would hard-kill the function.
const TIME_BUDGET_MS = 45_000;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const db = getDb();
  // Round 46 — "pending_review" cases (Plus accounts past the 10-case
  // auto-approved band, awaiting a one-click admin approval) never touch
  // the shared USCIS quota until approved.
  const rows = await db
    .select()
    .from(trackedCases)
    .where(eq(trackedCases.status, "active"))
    .orderBy(sql`${trackedCases.lastCheckedAt} ASC NULLS FIRST`, asc(trackedCases.createdAt));

  let checked = 0;
  let notified = 0;
  const errors: Array<{ id: string; message: string }> = [];
  let stoppedEarly = false;

  for (const row of rows) {
    if (Date.now() - startedAt >= TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    try {
      const { notified: wasNotified } = await checkTrackedCaseNow(row);
      checked++;
      if (wasNotified) notified++;
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

  return Response.json({
    checked,
    notified,
    errors,
    stoppedEarly,
    remaining: rows.length - checked - errors.length,
  });
}
