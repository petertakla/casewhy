// Round 114 follow-up — Cloud's review of the demo brief pointed out that
// "nothing in the API client throttles calls directly" is a sentence a
// reviewer will underline. Real hard caps, enforced in code before any
// call is made, not just documented pacing discipline.
//
// The exact production quota USCIS will grant isn't known yet -- their
// own portal states daily quota/throughput details are shared once
// production access is approved. Rather than assert an unverified number,
// these defaults are set at the SANDBOX limits this project has directly
// and repeatedly confirmed through its own live testing (5 TPS, 1,000
// requests/day -- see sandbox-volume-test.ts), and are configurable via
// env vars so they can be raised once USCIS shares the real production
// figures. Engineering judgment, same spirit as uscis-sandbox-volume-
// test-plan.md's own explicitly-labeled numbers -- not a discovered
// requirement.
//
// Deliberately set the daily cap AT 1,000, not comfortably under it: this
// week's own real sandbox volume test already paces itself to ~900/day
// by design (see uscis-sandbox-volume-test-plan.md), specifically to stay
// under that same real ceiling with its own margin. A tighter self-
// imposed cap here (e.g. 900) would risk this guard tripping and halting
// that same in-progress, time-critical test mid-run -- the opposite of
// what a safety guard should do. This cap exists to catch a genuine
// runaway/bug, not to second-guess an already-deliberately-paced plan.

import { count, gte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { uscisApiCallLog } from "@/lib/db/schema";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";

const DEFAULT_DAILY_CAP = 1000; // the sandbox's real confirmed daily ceiling
const DEFAULT_TPS_CAP = 4; // under the sandbox's confirmed 5 TPS ceiling

function dailyCap(): number {
  const raw = process.env.USCIS_DAILY_CALL_CAP;
  return raw ? Number(raw) : DEFAULT_DAILY_CAP;
}

function tpsCap(): number {
  const raw = process.env.USCIS_TPS_CAP;
  return raw ? Number(raw) : DEFAULT_TPS_CAP;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Throws before making a real Case Status API call if either cap would be
 * exceeded, and logs a real ops_task so it's actually noticed, not just a
 * console line. Never silently drops a call -- the caller sees a clear
 * error either way.
 */
export async function assertUscisCallBudget(): Promise<void> {
  const db = getDb();
  const [dailyRow] = await db
    .select({ n: count() })
    .from(uscisApiCallLog)
    .where(gte(uscisApiCallLog.calledAt, startOfTodayUtc()));
  const dailyCount = dailyRow?.n ?? 0;

  if (dailyCount >= dailyCap()) {
    await createOpsTaskIfNotOpen({
      type: "uscis-daily-cap-hit",
      title: "USCIS Case Status API daily call cap reached",
      description: `Reached ${dailyCount}/${dailyCap()} calls today (UTC calendar day). Raise USCIS_DAILY_CALL_CAP once USCIS confirms the real production quota, or wait until the cap resets at midnight UTC.`,
    });
    throw new Error(`USCIS Case Status API daily call cap (${dailyCap()}) reached for today.`);
  }

  const [tpsRow] = await db
    .select({ n: count() })
    .from(uscisApiCallLog)
    .where(gte(uscisApiCallLog.calledAt, new Date(Date.now() - 1000)));
  const lastSecondCount = tpsRow?.n ?? 0;

  if (lastSecondCount >= tpsCap()) {
    await createOpsTaskIfNotOpen({
      type: "uscis-tps-cap-hit",
      title: "USCIS Case Status API TPS cap reached",
      description: `${lastSecondCount} calls in the last second reached the ${tpsCap()}-TPS cap. Check for an unintended burst (e.g. a runaway loop) rather than raising the cap by default.`,
    });
    throw new Error(`USCIS Case Status API rate cap (${tpsCap()} TPS) reached -- try again in a moment.`);
  }

  await db.insert(uscisApiCallLog).values({});
}
