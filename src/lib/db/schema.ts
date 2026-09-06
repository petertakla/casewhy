// Drizzle schema for CaseWhy's own tables. Neon Auth manages its own
// `neon_auth` schema (users, sessions) separately — never migrated here.

import { pgTable, pgEnum, text, timestamp, integer, index, primaryKey, unique, boolean } from "drizzle-orm/pg-core";

export const trackedCases = pgTable(
  "tracked_cases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Neon Auth's user id (from session.user.id). CW-36: no longer unique —
    // free accounts are capped at 1 row and paid ("plus") at 5, enforced in
    // application code (src/app/dashboard/actions.ts), not the DB, since the
    // cap depends on subscription tier. A plain index still keeps
    // per-user lookups fast.
    userId: text("user_id").notNull(),
    // AES-256-GCM ciphertext (base64), not plaintext — see src/lib/db/crypto.ts.
    receiptNumber: text("receipt_number").notNull(),
    // Encrypted, denormalized from session.user.email at track-time — used
    // to send status-change notifications without querying Neon Auth's
    // own neon_auth schema directly.
    email: text("email").notNull(),
    // Encrypted; last status text seen by the status-change cron. Null
    // until the first cron run after tracking.
    lastStatusText: text("last_status_text"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tracked_cases_user_id_idx").on(table.userId)]
);

export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "plus"]);

// Per-account subscription tier (CW-35/36 packaging — see CLOUD_CLAUDE.md
// for the confirmed pricing/limits). No row for a user means "free" — the
// default until a real Stripe subscription exists.
//
// Round 13 — live billing, Stripe test mode. `tier` is now driven by the
// webhook handler (src/app/api/webhooks/stripe/route.ts), not just a
// manual/debug script. The Stripe fields mirror Stripe's own subscription
// object so the webhook can be a thin sync layer rather than reinventing
// subscription state: `status` uses Stripe's own status strings (active,
// past_due, canceled, incomplete, etc.) verbatim. Per the decided
// downgrade behavior, `tier` stays "plus" through `currentPeriodEnd` even
// after `cancelAtPeriodEnd` is set or a payment fails (`status` becomes
// past_due) — only `customer.subscription.deleted` (or the period
// genuinely ending) flips `tier` back to "free". See getSubscriptionTier()
// in src/lib/billing/tier.ts.
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id").primaryKey(),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  /** Stripe's own subscription status string (active, past_due, canceled, incomplete, unpaid, ...). Null until a subscription exists. */
  status: text("status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 13 — dedupes Stripe webhook deliveries (Stripe can and does retry/
// redeliver events) so a re-sent checkout.session.completed can't
// double-process. Keyed on Stripe's own event ID.
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(), // Stripe event ID, e.g. "evt_..."
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

// CW-35's chat metering: one row per user per calendar month (UTC),
// incremented once per successful chat reply. See
// src/lib/billing/chat-usage.ts.
export const chatUsage = pgTable(
  "chat_usage",
  {
    userId: text("user_id").notNull(),
    yearMonth: text("year_month").notNull(), // "2026-09"
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.yearMonth] })]
);

// CW-38 — supporting-document vault. Tied to a specific tracked case (not
// just a user), per CW-36's multi-case model: an I-693 or RFE response
// belongs to one case, not the whole account. userId is denormalized here
// too (defense-in-depth: lets /api/documents check ownership with a single
// row read, without also joining tracked_cases on every request).
export const caseDocuments = pgTable(
  "case_documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    trackedCaseId: text("tracked_case_id")
      .notNull()
      .references(() => trackedCases.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    // Encrypted (AES-256-GCM, src/lib/db/crypto.ts) — a real filename like
    // "John_Smith_Passport.pdf" is identifying, same reasoning as
    // tracked_cases.receiptNumber.
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    // Vercel Blob pathname (not the full URL) — private-store blobs aren't
    // fetchable by URL alone, so downloads are proxied through
    // /api/documents/[id] using blob's get(), keyed off this pathname.
    blobPathname: text("blob_pathname").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("case_documents_tracked_case_id_idx").on(table.trackedCaseId)]
);

// Round 6 — pre-launch marketing email list from the landing page's
// EmailCaptureForm (src/app/page.tsx, two instances: hero + footer). Plain
// text, not encrypted like tracked_cases.email — this is a public opt-in
// newsletter address with no case data attached, and a real DB-level
// unique constraint (to silently no-op a repeat signup) needs the value
// comparable at the database, which an app-level AES-256-GCM ciphertext
// (random IV per row) can't support.
export const emailSubscribers = pgTable(
  "email_subscribers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    sourcePage: text("source_page").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("email_subscribers_email_unique").on(table.email)]
);

// CW-39 — one mailing address per account ("enter it once"), not per case.
// Encrypted (AES-256-GCM) as a single JSON blob rather than per-field
// columns — this is genuinely new, more sensitive PII (a real street
// address), same standard as tracked_cases.receiptNumber. Plus-gated:
// the representative-lookup and letter-drafting tools are the only
// things that read this.
export const mailingAddresses = pgTable("mailing_addresses", {
  userId: text("user_id").primaryKey(),
  // Encrypted JSON: {street, city, state, zip}
  address: text("address").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// CW-39 — records each escalation letter a user has generated, so the
// dashboard can nudge them toward the next template in the sequence
// (congressional -> field-office -> Ombudsman) roughly 14 days after the
// previous one if the case still hasn't moved, per the concept doc's
// walkthrough. Tied to a tracked case, same reasoning as case_documents.
export const escalationLetterEnum = pgEnum("escalation_letter_type", [
  "congressional",
  "field_office",
  "ombudsman",
]);

export const escalationLetters = pgTable(
  "escalation_letters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    trackedCaseId: text("tracked_case_id")
      .notNull()
      .references(() => trackedCases.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    letterType: escalationLetterEnum("letter_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("escalation_letters_tracked_case_id_idx").on(table.trackedCaseId)]
);

// Round 14 — Settings page. No row means "notifications on", same
// no-row-means-default convention as `subscriptions` (free tier). Only
// one real toggle exists today (status-change emails); add columns here
// as more notification types are actually built, not speculatively.
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  statusChangeEmailsEnabled: boolean("status_change_emails_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 14 — /news page source picker. Stores OPT-OUTS, not opt-ins: a
// source a user has never touched is enabled by default (per the
// "default all-on for new accounts" spec), and adding a new entry to
// NEWS_SOURCES (src/lib/news/sources.ts) needs no backfill here — it's
// simply absent from every user's disabled set until they uncheck it.
export const disabledNewsSources = pgTable(
  "disabled_news_sources",
  {
    userId: text("user_id").notNull(),
    sourceId: text("source_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.sourceId] })]
);
