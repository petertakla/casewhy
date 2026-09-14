import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// Round 73 (real) — SOCIAL_MEDIA_GUARDRAILS.md Section 6 ("keep a running
// log of what was drafted, where, whether it was posted, and any response
// it got"). The marketing_queue table IS the log per the task doc's own
// framing -- this page is just a per-channel rollup view over it, plus a
// CSV export link for the weekly cloud-session read the task doc mentions.
export default async function MarketingLogPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db.select().from(marketingQueue).orderBy(desc(marketingQueue.createdAt));

  const counts: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    counts[row.channel] ??= {};
    counts[row.channel][row.status] = (counts[row.channel][row.status] ?? 0) + 1;
  }

  // "skipped" was missing from this list -- rows with that status were
  // still counted into each channel's Total (via Object.values(byStatus)
  // below) with no column to show them in, so totals silently didn't
  // match the visible columns. Round 89 restored "skipped" as a real,
  // distinct status; this list just hadn't been updated to match.
  const statuses = ["pending", "approved", "posted", "edited_posted", "rejected", "escalated", "skipped"] as const;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Marketing log</h1>
        <Link href="/admin/marketing" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          ← Back to queue
        </Link>
      </div>
      <p className="mb-6 mt-2 text-muted">
        Per-channel counts across every item ever queued. <a href="/admin/marketing/log/export.csv" className="text-brand-600 hover:underline dark:text-brand-400">Download CSV</a>.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-strong text-left text-xs uppercase tracking-widest text-muted">
              <th className="py-2 pr-4">Channel</th>
              {statuses.map((s) => (
                <th key={s} className="py-2 pr-4">
                  {s}
                </th>
              ))}
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(counts).map(([channel, byStatus]) => {
              const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
              return (
                <tr key={channel} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{channel}</td>
                  {statuses.map((s) => (
                    <td key={s} className="py-2 pr-4 text-muted">
                      {byStatus[s] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 font-medium">{total}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={statuses.length + 2} className="py-8 text-center text-muted">
                  Nothing logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
