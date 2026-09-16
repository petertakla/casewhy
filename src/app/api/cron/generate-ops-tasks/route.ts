// Round 112 Part B — monthly check for recurring tasks that need a real
// human step and can't be fully automated (see src/lib/ops/ops-tasks.ts).
// Same bearer-secured pattern as every other /api/cron/* route.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { PROCESSING_TIMES, daysSince, STALENESS_THRESHOLD_DAYS } from "@/lib/kb/processing-times";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, { created: boolean }> = {};

  const staleEntries = PROCESSING_TIMES.filter((e) => daysSince(e.asOf) > STALENESS_THRESHOLD_DAYS);
  if (staleEntries.length > 0) {
    results.processingTimesRefresh = await createOpsTaskIfNotOpen({
      type: "processing-times-refresh",
      title: "Refresh processing-times figures",
      description:
        `${staleEntries.length} entr${staleEntries.length === 1 ? "y is" : "ies are"} more than ${STALENESS_THRESHOLD_DAYS} days old: ` +
        staleEntries.map((e) => `${e.id} (asOf ${e.asOf}, ${daysSince(e.asOf)} days ago)`).join("; ") +
        ". Re-drive egov.uscis.gov/processing-times in a real browser (it blocks automated fetches) and update src/lib/kb/processing-times.ts.",
    });
  }

  return Response.json({ checkedAt: new Date().toISOString(), results });
}
