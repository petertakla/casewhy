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
  group: "Marketing" | "Content" | "Mail" | "Outreach" | "Billing" | "Ops" | "Help";
  description: string;
  /** True for entries nav-counts.ts's getAdminPendingCounts() computes a live number for. */
  hasPendingCount?: boolean;
  /** Round 101 — opens in a new tab (rel="noopener noreferrer") with an
   * external-link glyph after the label. The shell never treats an
   * external entry as "the current page" and findAdminNavEntry() ignores
   * these entirely, since a full external URL can't match a pathname
   * anyway and shouldn't be considered for the breadcrumb. */
  external?: boolean;
  /** Round 120/124 — a short, plain-language walkthrough of what this page
   * is for and how to use it, grounded in reading the page's own current
   * code (not the task doc that originally built it — labels/flows can
   * drift). Rendered on /admin/how-to via src/lib/help's shared components,
   * the same ones the public /help page uses. */
  howTo?: {
    steps: string[];
    notes?: string[];
  };
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
    howTo: {
      steps: [
        "Use the \"Needs action\" / \"Recent history\" toggle to switch between what still needs a decision and what's already been posted, edited, or rejected in the last 30 days.",
        "Use the channel chips to filter to one platform, or leave \"All\" selected.",
        "Amber-highlighted cards were flagged by the classifier instead of drafted normally — read the flag reason before deciding (a legal-advice request, hostile tone, a crisis signal, an EO 14161 question, or the first post ever in a new community).",
        "Community/forum channels never post automatically: copy the text yourself, post it, then mark it here.",
        "Blog, X, and Threads can auto-post — a real approval click actually posts (X/Threads need their API credentials set first, or the click surfaces a clear error instead of silently failing).",
      ],
    },
  },
  {
    href: "/admin/marketing/log",
    label: "Log",
    labelEs: "Registro",
    group: "Marketing",
    description: "Per-channel counts across every item ever queued, plus CSV export.",
    howTo: {
      steps: [
        "Read straight down the table: one row per channel, one column per status, with a running total on the right.",
        "Use \"Download CSV\" for the full underlying data — useful for a weekly review outside the app.",
      ],
    },
  },
  {
    href: "/admin/marketing/attribution",
    label: "Attribution",
    labelEs: "Atribución",
    group: "Marketing",
    description: "Which channel brought which sign-ups, tracked cases, and Plus conversions.",
    howTo: {
      steps: [
        "Each row is one (source, medium, campaign) combination from a UTM-tagged link.",
        "Read left to right as a funnel: landings → sign-ups → tracked a case → went Plus.",
        "No rows means no UTM-tagged traffic has been recorded yet — this isn't a bug, it's the real state.",
      ],
    },
  },
  {
    href: "/admin/marketing/settings",
    label: "Settings",
    labelEs: "Configuración",
    group: "Marketing",
    description: "The subreddit list, the daily draft cap, and the links_enabled gate.",
    howTo: {
      steps: [
        "Edit the subreddit reference list and the daily draft cap directly in the form — changes take effect immediately, no deploy needed.",
        "The X free-tier write count near the top shows this calendar month's usage against the hard limit; it turns red near the cap.",
        "Guardrails and channel-specific rules (what's allowed to auto-post vs. always stage for review) live in `SOCIAL_MEDIA_GUARDRAILS.md`, not here — this page is only the numeric/list settings.",
      ],
    },
  },
  {
    href: "/admin/search",
    label: "Search",
    labelEs: "Búsqueda",
    group: "Marketing",
    description: "Top searches and zero-result queries, last 30 days.",
    howTo: {
      steps: [
        "\"Top queries\" (left) shows what people search for most, split by language, with how often a result was clicked or a question was asked instead.",
        "\"Zero-result queries\" (right) is the real content-gap signal — what people looked for and CaseWhy had nothing to show.",
        "No user id or IP is ever recorded against a search event.",
      ],
    },
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
    howTo: {
      steps: [
        "Every post that exists on disk is listed, whether or not it's been queued or published — status shows Published, Pending, Rejected, or Not queued.",
        "\"Preview\" opens the live rendered post in a new tab (with a `?preview=1` flag if it isn't published yet).",
        "\"Edit\" opens the post's editor to change its content directly.",
        "An \"Edited\" badge means the live version has been changed since it was originally drafted.",
      ],
    },
  },
  {
    href: "/admin/inbox",
    label: "Replies",
    labelEs: "Respuestas de correo",
    group: "Mail",
    description: "Drafted replies to privacy@, help@, corrections@, and the other response aliases.",
    hasPendingCount: true,
    howTo: {
      steps: [
        "Every card here is a drafted reply that has NOT been sent yet.",
        "Read the incoming message and the drafted reply, edit the reply text if needed, then approve (sends it) or reject.",
        "Urgent items (from security@/legal@, always polled every 5 minutes) sort to the top.",
      ],
    },
  },
  {
    href: "/admin/backlink-outreach",
    label: "Backlink drafts",
    labelEs: "Borradores de enlaces",
    group: "Outreach",
    description: "Draft partner-outreach emails, attorney directory only, awaiting review.",
    hasPendingCount: true,
    howTo: {
      steps: [
        "These drafts can't actually be sent yet — there's no send capability wired up. \"Approve\" just marks a draft ready for whenever sending is built.",
        "Scoped to the attorney directory only — the other five Get Help entity types have no per-listing email address to draft to.",
      ],
    },
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
    howTo: {
      steps: ["Opens Stripe's own dashboard in a new tab — CaseWhy has no coupon UI of its own; coupons are created and managed entirely in Stripe."],
    },
  },
  {
    href: "https://dashboard.stripe.com/subscriptions",
    label: "Subscriptions (Stripe)",
    labelEs: "Suscripciones (Stripe)",
    group: "Billing",
    description: "Every Plus subscription, its status, and the customer portal history.",
    external: true,
    howTo: {
      steps: ["Opens Stripe's own dashboard in a new tab — the real source of truth for subscription status, invoices, and the customer portal's own change history."],
    },
  },
  {
    href: "/admin/ops-tasks",
    label: "Ops tasks",
    labelEs: "Tareas operativas",
    group: "Ops",
    description: "Recurring tasks that need a real human step, e.g. the monthly processing-times refresh.",
    hasPendingCount: true,
    howTo: {
      steps: [
        "A cron job noticed something was due but couldn't fully automate it itself — usually because the real source blocks automated fetches and needs a real browser.",
        "Mark a task done once you've handled it, or dismiss it if it doesn't apply this cycle.",
      ],
    },
  },
  {
    href: "/admin/ops",
    label: "Ops console",
    labelEs: "Consola de operaciones",
    group: "Ops",
    description: "Poll interval, review mode, start/stop, and notes for every email alias and social channel.",
    howTo: {
      steps: [
        "Email aliases section: change how often each alias is polled and whether it drafts for review or acts automatically. security@ and legal@ are locked to a 5-minute poll with an urgent alert — not editable here.",
        "Social channels section: start/stop a channel or change its posting mode. Facebook's mode isn't editable — the owned Page auto-posts, Groups always stage for review.",
        "Use \"Add channel\" to bring a new social channel under monitoring from the addable pool.",
        "Edits apply on the next poll — no code change or deploy needed.",
      ],
    },
  },
  {
    href: "/admin/how-to",
    label: "How-To guide",
    labelEs: "Guía de cómo hacerlo",
    group: "Help",
    description: "A walkthrough of every admin page above, with a live link to each one.",
  },
];

export const ADMIN_NAV_GROUPS = ["Marketing", "Content", "Mail", "Outreach", "Billing", "Ops", "Help"] as const;

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
