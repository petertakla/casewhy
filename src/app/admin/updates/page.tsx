import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUpdatesForAdmin, type AdminUpdateRow } from "@/lib/updates/updates";

// Round 107 — the optional admin list view round 103 explicitly skipped
// ("the queue card's own Preview link already covers the real workflow"),
// now built for real since this round adds an actual editor that needs
// somewhere to link from. Every post on disk, not just ones already in
// the round-89 queue, so a post added to the repo but not yet seeded into
// marketing_queue still shows up here (status: not queued) rather than
// being invisible until someone remembers to run the seed script.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Updates | Admin | CaseWhy",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_LABEL: Record<AdminUpdateRow["publishStatus"], string> = {
  posted: "Published",
  edited_posted: "Published",
  pending: "Pending",
  approved: "Pending",
  escalated: "Pending",
  skipped: "Pending",
  rejected: "Rejected",
  not_queued: "Not queued",
};

const STATUS_CLASS: Record<AdminUpdateRow["publishStatus"], string> = {
  posted: "bg-green-500/15 text-green-700 dark:text-green-400",
  edited_posted: "bg-green-500/15 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  escalated: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  skipped: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
  not_queued: "bg-surface-2 text-muted",
};

export default async function AdminUpdatesPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const rows = await getUpdatesForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
      <p className="mb-8 mt-2 text-muted">
        Every blog post on disk: published or not, edited or not, with preview and edit links.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No posts on disk yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs font-semibold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const previewHref =
                  row.publishStatus === "posted" || row.publishStatus === "edited_posted"
                    ? `/updates/${row.slug}`
                    : `/updates/${row.slug}?preview=1`;
                return (
                  <tr key={row.slug} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {row.title}
                      {row.edited && (
                        <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-brand-600 dark:text-brand-400">
                          Edited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{row.slug}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(row.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[row.publishStatus]}`}>
                        {STATUS_LABEL[row.publishStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={previewHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          Preview ↗
                        </a>
                        <Link
                          href={`/admin/updates/${row.slug}/edit`}
                          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
