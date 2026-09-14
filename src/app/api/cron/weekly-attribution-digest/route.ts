import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { getAttributionRows } from "@/lib/marketing/attribution";
import { sendWeeklyAttributionDigest } from "@/lib/email/postmark";

// Round 93 Part C — "Weekly Monday 09:00 ET digest email to
// info@casewhy.com, reusing the existing alias/Postmark send path." This
// route does the computation + send; the actual Monday-09:00-ET schedule
// is cron-job.org's job, same as every other CaseWhy cron since the
// GitHub Actions migration (see CLOUD_CLAUDE.md) -- registering it there
// is one of the few things this session genuinely can't do itself
// (needs Peter's cron-job.org login), so it's listed as a real one-time
// step below rather than silently left undone.

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getAttributionRows();
  const rowsText =
    rows.length === 0
      ? "(no UTM-tagged traffic recorded yet)"
      : rows
          .map(
            (r) =>
              `${r.source} / ${r.medium} / ${r.campaign}: ${r.landings} landings, ${r.signUps} sign-ups, ${r.trackedCases} tracked a case, ${r.plusConversions} went Plus`
          )
          .join("\n");

  await sendWeeklyAttributionDigest({ rows: rowsText });

  return Response.json({ sent: true, sourceCount: rows.length });
}
