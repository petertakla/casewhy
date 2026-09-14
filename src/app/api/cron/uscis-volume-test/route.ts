// Round 86 (urgent, Sep 14) — one run of the USCIS sandbox volume-test
// plan (`uscis-sandbox-volume-test-plan.md` at repo root). USCIS rejected
// the first production-access affidavit request (Sep 11) for insufficient
// sandbox traffic — 1 success + 1 error call/day was trivially low. This
// generates real, varied traffic through the app's actual getCaseStatus()
// code path (never a mock) so a fresh 5-consecutive-business-day log
// (Mon Sep 14 - Fri Sep 18) can support re-requesting the affidavit.
//
// Actual call-generation logic lives in src/lib/uscis/sandbox-volume-test.ts
// (shared with scripts/uscis-volume-run.ts) -- see that file's own comment
// for a real correction found the first time this ran: the sandbox mocks
// only a small, curated pool of specific receipt numbers, not any
// well-formed one as earlier assumed.
//
// One call to this route = one "run" (~50 calls: ~30 success, ~20 error),
// paced ~1-1.5s apart so a run takes well under 2 minutes and stays
// comfortably under the sandbox's published 5 TPS ceiling. The plan calls
// for 18 runs/day spread across the sandbox's 7AM-8PM ET operating hours
// (~every 40-45 min, ~900 calls/day total) -- register this at
// cron-job.org on that schedule, same account as poll-aliases/check-status.
// Never call this outside 7AM-8PM ET Mon-Fri; the sandbox won't be up
// anyway (confirmed real in this project multiple times).

import { runOneVolumeTestBatch } from "@/lib/uscis/sandbox-volume-test";

export const maxDuration = 150;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runOneVolumeTestBatch();
  return Response.json(result);
}
