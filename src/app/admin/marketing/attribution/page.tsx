import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getAttributionRows } from "@/lib/marketing/attribution";

export const dynamic = "force-dynamic";

// Round 93 Part C — per (source, medium, campaign) funnel. See
// src/lib/marketing/attribution.ts for how landings/sign-ups/tracked-
// cases/Plus-conversions are actually computed (shared with the weekly
// digest cron so the two never drift on what these numbers mean).

function keyOf(source: string, medium: string, campaign: string): string {
  return `${source} ${medium} ${campaign}`;
}

export default async function AttributionPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const rows = await getAttributionRows();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Marketing attribution</h1>
      <p className="mb-8 mt-2 text-muted">
        Per source/campaign: landings (visits carrying a utm-tagged link), sign-ups whose first touch was that
        source, and how many of those sign-ups went on to track a case or upgrade to Plus.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No UTM-tagged traffic recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Medium</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3 text-right">Landings</th>
                <th className="px-4 py-3 text-right">Sign-ups</th>
                <th className="px-4 py-3 text-right">Tracked a case</th>
                <th className="px-4 py-3 text-right">Went Plus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={keyOf(row.source, row.medium, row.campaign)} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{row.source}</td>
                  <td className="px-4 py-3 text-muted">{row.medium}</td>
                  <td className="px-4 py-3 text-muted">{row.campaign}</td>
                  <td className="px-4 py-3 text-right">{row.landings}</td>
                  <td className="px-4 py-3 text-right">{row.signUps}</td>
                  <td className="px-4 py-3 text-right">{row.trackedCases}</td>
                  <td className="px-4 py-3 text-right">{row.plusConversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
