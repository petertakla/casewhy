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
  group: "Marketing" | "Content" | "Mail" | "Outreach" | "Billing";
  description: string;
  /** True for entries nav-counts.ts's getAdminPendingCounts() computes a live number for. */
  hasPendingCount?: boolean;
  /** Round 101 — opens in a new tab (rel="noopener noreferrer") with an
   * external-link glyph after the label. The shell never treats an
   * external entry as "the current page" and findAdminNavEntry() ignores
   * these entirely, since a full external URL can't match a pathname
   * anyway and shouldn't be considered for the breadcrumb. */
  external?: boolean;
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
    href: "/admin/search",
    label: "Search",
    labelEs: "Búsqueda",
    group: "Marketing",
    description: "Top searches and zero-result queries, last 30 days.",
  },
  // Round 107 — a new group, placed right after Marketing per the task
  // doc's own instruction, since editing a post is a natural next step
  // from reviewing it in the Marketing queue (round 103), not a separate
  // concern like Mail/Outreach/Billing.
  {
    href: "/admin/updates",
    label: "Updates",
    labelEs: "Actualizaciones",
    group: "Content",
    description: "Every blog post on disk: published or not, edited or not, with preview and edit links.",
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
  // Round 101 — round 50 deliberately has no CaseWhy coupon UI (Stripe's
  // dashboard is the UI); these two entries just make that reachable from
  // the admin shell instead of Peter having to remember it lives there.
  {
    href: "https://dashboard.stripe.com/coupons",
    label: "Coupons & promo codes (Stripe)",
    labelEs: "Cupones y códigos promocionales (Stripe)",
    group: "Billing",
    description: "100%-off codes for internal testers and partner comps; created in Stripe, redeemed at checkout (round 50).",
    external: true,
  },
  {
    href: "https://dashboard.stripe.com/subscriptions",
    label: "Subscriptions (Stripe)",
    labelEs: "Suscripciones (Stripe)",
    group: "Billing",
    description: "Every Plus subscription, its status, and the customer portal history.",
    external: true,
  },
];

export const ADMIN_NAV_GROUPS = ["Marketing", "Content", "Mail", "Outreach", "Billing"] as const;

export function findAdminNavEntry(pathname: string): AdminNavEntry | undefined {
  // Longest-href-first so a child route (e.g. /admin/marketing/log)
  // matches its own entry rather than the parent queue page's. External
  // entries are excluded outright — a full URL can never match a
  // same-origin pathname anyway, but excluding them here (rather than
  // relying on that) keeps the breadcrumb from ever being able to land on
  // one, which is the actual requirement.
  return [...ADMIN_NAV]
    .filter((entry) => !entry.external)
    .sort((a, b) => b.href.length - a.href.length)
    .find((entry) => pathname.startsWith(entry.href));
}
