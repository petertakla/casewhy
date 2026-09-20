"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_NAV, ADMIN_NAV_GROUPS, findAdminNavEntry, type AdminNavEntry } from "@/lib/admin/nav";

// Round 98 — client half of the admin shell (needs usePathname() for
// active-state/breadcrumb, which server layouts can't read directly).
// The auth gate itself lives in layout.tsx (server) above this -- this
// component only ever renders once that's already passed.

const GROUP_LABELS_ES: Record<(typeof ADMIN_NAV_GROUPS)[number], string> = {
  Marketing: "Marketing",
  Content: "Contenido",
  Mail: "Correo",
  Outreach: "Contacto",
  Billing: "Facturación",
  Ops: "Operaciones",
  Help: "Ayuda",
};

function useIsSpanish(): boolean {
  // Same cookie AuthHeader.tsx sets/reads (round 79-83) -- the admin
  // shell has no separate /es/admin route (out of this round's scope),
  // but still honors the visitor's sticky language preference for its
  // own labels, per the task's "Spanish labels render throughout the
  // shell" verify-live bullet.
  const [isSpanish, setIsSpanish] = useState(false);
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )casewhy_locale=([^;]*)/);
    setIsSpanish(match?.[1] === "es");
  }, []);
  return isSpanish;
}

function buildBreadcrumb(pathname: string, isSpanish: boolean): { label: string; href: string }[] {
  const dashboard = { label: isSpanish ? "Panel" : "Dashboard", href: "/dashboard" };
  const admin = { label: isSpanish ? "Administración" : "Admin", href: "/admin" };
  const entry = findAdminNavEntry(pathname);
  if (!entry) return [dashboard, admin];

  const groupFirstEntry = ADMIN_NAV.find((e) => e.group === entry.group)!;
  const crumbs = [
    dashboard,
    admin,
    { label: isSpanish ? GROUP_LABELS_ES[entry.group] : entry.group, href: groupFirstEntry.href },
  ];
  if (entry.href !== groupFirstEntry.href) {
    crumbs.push({ label: isSpanish ? entry.labelEs : entry.label, href: entry.href });
  }
  return crumbs;
}

function NavLink({
  entry,
  active,
  isSpanish,
  count,
}: {
  entry: AdminNavEntry;
  active: boolean;
  isSpanish: boolean;
  count: number | undefined;
}) {
  const className = `flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
    active ? "bg-brand-500/10 font-semibold text-brand-600 dark:text-brand-400" : "text-muted hover:bg-surface-2 hover:text-foreground"
  }`;
  const label = (
    <span>
      {isSpanish ? entry.labelEs : entry.label}
      {entry.external && <span aria-hidden="true"> ↗</span>}
    </span>
  );

  // Round 101 — external (Stripe) entries are never "the current page",
  // so they're a plain new-tab link, not a Next <Link>, and never get the
  // active-highlight treatment.
  if (entry.external) {
    return (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={entry.href} className={className}>
      {label}
      {!!count && count > 0 && (
        <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[0.7rem] font-bold text-white">{count}</span>
      )}
    </Link>
  );
}

export function AdminShellClient({
  children,
  pendingCounts,
}: {
  children: React.ReactNode;
  pendingCounts: Record<string, number>;
}) {
  const pathname = usePathname();
  const isSpanish = useIsSpanish();
  const breadcrumb = buildBreadcrumb(pathname, isSpanish);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
        ← {isSpanish ? "Volver al panel" : "Back to dashboard"}
      </Link>

      <nav className="mb-6 mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">›</span>}
            {i === breadcrumb.length - 1 ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Mobile: top tab strip, horizontally scrollable. Desktop: left sidebar. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <aside className="md:w-52 md:flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group} className="md:mb-5 md:last:mb-0">
                <p className="mb-1.5 hidden px-3 text-xs font-semibold uppercase tracking-widest text-muted md:block">
                  {isSpanish ? GROUP_LABELS_ES[group] : group}
                </p>
                <div className="flex gap-1.5 md:flex-col">
                  {ADMIN_NAV.filter((e) => e.group === group).map((entry) => (
                    <NavLink
                      key={entry.href}
                      entry={entry}
                      active={pathname.startsWith(entry.href)}
                      isSpanish={isSpanish}
                      count={pendingCounts[entry.href]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
