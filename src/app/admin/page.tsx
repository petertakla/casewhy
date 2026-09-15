import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
import { getAdminPendingCounts } from "@/lib/admin/nav-counts";

// Round 98 — the admin home. Auth gating happens once in layout.tsx above
// this; every page under /admin/* (including this one) is reachable from
// here and from the shell's own sidebar, so nothing added to the
// registry can end up orphaned the way six earlier rounds' pages were.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | CaseWhy",
};

export default async function AdminIndexPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const countsByHref = await getAdminPendingCounts();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mb-8 mt-2 text-muted">Every admin surface, in one place.</p>

      <div className="space-y-8">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ADMIN_NAV.filter((e) => e.group === group).map((entry) => {
                const count = countsByHref[entry.href];
                const cardClassName = "rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong";
                const cardBody = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {entry.label}
                        {entry.external && <span aria-hidden="true"> ↗</span>}
                      </span>
                      {!!count && count > 0 && (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{entry.description}</p>
                  </>
                );
                // Round 101 — Billing's entries point at Stripe's own
                // dashboard, so they're a plain new-tab link, not a Next
                // <Link> (which would try to client-navigate to it).
                return entry.external ? (
                  <a key={entry.href} href={entry.href} target="_blank" rel="noopener noreferrer" className={cardClassName}>
                    {cardBody}
                  </a>
                ) : (
                  <Link key={entry.href} href={entry.href} className={cardClassName}>
                    {cardBody}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
