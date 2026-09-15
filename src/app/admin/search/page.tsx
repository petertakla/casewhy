import { redirect } from "next/navigation";
import { desc, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { searchEvents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// Round 110 — "what do people look for and not find," per the task doc's
// own framing for this page. Two tables: top queries (grouped, most
// frequent first) and zero-result queries (resultCounts parses to all
// zeros and the outcome wasn't a click) -- both last 30 days, both
// locale-split so Spanish queries don't get buried under English volume.
export default async function AdminSearchPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(searchEvents)
    .where(gte(searchEvents.createdAt, thirtyDaysAgo))
    .orderBy(desc(searchEvents.createdAt));

  const topQueries = new Map<string, { count: number; locale: string; clicked: number; asked: number }>();
  const zeroResultQueries = new Map<string, { count: number; locale: string }>();

  for (const row of rows) {
    const key = `${row.locale}::${row.query.toLowerCase()}`;
    const entry = topQueries.get(key) ?? { count: 0, locale: row.locale, clicked: 0, asked: 0 };
    entry.count++;
    if (row.outcome === "clicked_result") entry.clicked++;
    if (row.outcome === "asked_casewhy") entry.asked++;
    topQueries.set(key, entry);

    const totalResults = row.resultCounts
      .split(",")
      .map((part) => parseInt(part.split(":")[1] ?? "0", 10))
      .reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
    if (totalResults === 0 && row.outcome !== "clicked_result") {
      const zEntry = zeroResultQueries.get(key) ?? { count: 0, locale: row.locale };
      zEntry.count++;
      zeroResultQueries.set(key, zEntry);
    }
  }

  const topList = Array.from(topQueries.entries())
    .map(([key, v]) => ({ query: key.split("::")[1], ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  const zeroList = Array.from(zeroResultQueries.entries())
    .map(([key, v]) => ({ query: key.split("::")[1], ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <p className="mb-6 mt-2 text-muted">
        Top searches and zero-result queries from the last 30 days ({rows.length} total events). No user id or IP is
        ever recorded — see the search_events schema comment.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Top queries</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Query</th>
                  <th className="px-3 py-2 font-semibold">Locale</th>
                  <th className="px-3 py-2 font-semibold">Count</th>
                  <th className="px-3 py-2 font-semibold">Clicked</th>
                  <th className="px-3 py-2 font-semibold">Asked</th>
                </tr>
              </thead>
              <tbody>
                {topList.map((r) => (
                  <tr key={`${r.locale}-${r.query}`} className="border-t border-border">
                    <td className="px-3 py-2">{r.query}</td>
                    <td className="px-3 py-2 text-muted">{r.locale}</td>
                    <td className="px-3 py-2 font-mono">{r.count}</td>
                    <td className="px-3 py-2 font-mono text-muted">{r.clicked}</td>
                    <td className="px-3 py-2 font-mono text-muted">{r.asked}</td>
                  </tr>
                ))}
                {topList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      No searches logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Zero-result queries</h2>
          <p className="mb-2 text-xs text-muted">What people looked for and CaseWhy had nothing to show — the real content-gap signal.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Query</th>
                  <th className="px-3 py-2 font-semibold">Locale</th>
                  <th className="px-3 py-2 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {zeroList.map((r) => (
                  <tr key={`${r.locale}-${r.query}`} className="border-t border-border">
                    <td className="px-3 py-2">{r.query}</td>
                    <td className="px-3 py-2 text-muted">{r.locale}</td>
                    <td className="px-3 py-2 font-mono">{r.count}</td>
                  </tr>
                ))}
                {zeroList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-muted">
                      No zero-result queries in the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
