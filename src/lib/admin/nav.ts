// Round 98 — the single registry every admin surface reads from. Root
// cause this fixes: six rounds (70, 84, 85, 89, 93) each added an
// `/admin/*` page with its own one-off links (or none at all), and
// nothing forced a new page to register anywhere — Peter himself was the
// integration test, discovering pages only by knowing the URL already
// existed. Standing rule from this round on (see CLOUD_CLAUDE.md, next
// to rounds 88 and 95): a new /admin/* page registers here in the same
// round that creates it, or it isn't done.
//
// Client-safe on purpose (same split as src/lib/i18n/locale-href.ts,
// round 82) — AdminShellClient.tsx is a client component and needs this
// data for active-state highlighting and the breadcrumb, but the actual
// pending-count *queries* are server-only (pg can't run in a browser
// bundle). Those live in nav-counts.ts instead; a page that renders
// counts imports both.

export interface AdminNavEntry {
  href: string;
  label: string;
  labelEs: string;
  group: "Marketing" | "Mail" | "Outreach";
  description: string;
  /** True for entries nav-counts.ts's getAdminPendingCounts() computes a live number for. */
  hasPendingCount?: boolean;
}

// Order here is display order — grouped by the same key, group headers
// rendered in first-seen order (Marketing, then Mail, then Outreach).
export const ADMIN_NAV: AdminNavEntry[] = [
  {
    href: "/admin/marketing",
    label: "Queue",
    labelEs: "Cola de marketing",
    group: "Marketing",
    description: "Every pending and escalated marketing draft, across all channels.",
    hasPendingCount: true,
  },
  {
    href: "/admin/marketing/log",
    label: "Log",
    labelEs: "Registro",
    group: "Marketing",
    description: "Per-channel counts across every item ever queued, plus CSV export.",
  },
  {
    href: "/admin/marketing/attribution",
    label: "Attribution",
    labelEs: "Atribución",
    group: "Marketing",
    description: "Which channel brought which sign-ups, tracked cases, and Plus conversions.",
  },
  {
    href: "/admin/marketing/settings",
    label: "Settings",
    labelEs: "Configuración",
    group: "Marketing",
    description: "The subreddit list, the daily draft cap, and the links_enabled gate.",
  },
  {
    href: "/admin/inbox",
    label: "Replies",
    labelEs: "Respuestas de correo",
    group: "Mail",
    description: "Drafted replies to privacy@, help@, corrections@, and the other response aliases.",
    hasPendingCount: true,
  },
  {
    href: "/admin/aliases",
    label: "Alias config",
    labelEs: "Configuración de alias",
    group: "Mail",
    description: "Poll interval and action level for each of the 12 response aliases.",
  },
  {
    href: "/admin/backlink-outreach",
    label: "Backlink drafts",
    labelEs: "Borradores de enlaces",
    group: "Outreach",
    description: "Draft partner-outreach emails, attorney directory only, awaiting review.",
    hasPendingCount: true,
  },
];

export const ADMIN_NAV_GROUPS = ["Marketing", "Mail", "Outreach"] as const;

export function findAdminNavEntry(pathname: string): AdminNavEntry | undefined {
  // Longest-href-first so a child route (e.g. /admin/marketing/log)
  // matches its own entry rather than the parent queue page's.
  return [...ADMIN_NAV].sort((a, b) => b.href.length - a.href.length).find((entry) => pathname.startsWith(entry.href));
}
