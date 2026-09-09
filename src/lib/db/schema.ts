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
    // Round 21 — one of CASE_TYPES' ids (src/lib/kb/case-type-timeline.ts),
    // e.g. "n400", "i131", "other". Not encrypted — a form type alone isn't
    // identifying, unlike receiptNumber/email. Nullable only because rows
    // tracked before round 21 don't have one; the app requires a real
    // selection (including "other") for every new case going forward.
    caseType: text("case_type"),
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

// Round 14, revised round 17 — /news page source picker. Stores only
// DEVIATIONS from each source's own `defaultOn` (src/lib/news/sources.ts),
// not a full on/off row per source: a user who's never touched a given
// checkbox has no row for it, and its effective state is just that
// source's `defaultOn` — so adding a new NEWS_SOURCES entry needs no
// backfill here regardless of whether it defaults on or off. Round 17
// changed this from a pure opt-out set (every source defaulted on) to a
// per-source default, which needed an explicit `enabled` column here to
// represent "explicitly turned on despite defaulting off" as well as
// "explicitly turned off despite defaulting on."
export const newsSourcePreferences = pgTable(
  "news_source_preferences",
  {
    userId: text("user_id").notNull(),
    sourceId: text("source_id").notNull(),
    enabled: boolean("enabled").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.sourceId] })]
);

// Round 26 — Web Push subscriptions. One row per subscribed browser/device,
// not per user — a user can have several (phone, laptop, etc.), and each
// needs its own endpoint/keys to actually receive a push. No separate
// "push enabled" boolean anywhere: whether push is "on" for a given browser
// is just whether a row exists for that browser's own endpoint, checked
// client-side via pushManager.getSubscription() (the server has no way to
// know which endpoint belongs to "the current browser" ahead of time, the
// way it does for the single per-user email toggle above). Not encrypted —
// an endpoint/key pair is a delivery credential, not identifying case data,
// same reasoning as not encrypting Stripe IDs elsewhere in this schema.
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("push_subscriptions_user_id_idx").on(table.userId),
    unique("push_subscriptions_endpoint_unique").on(table.endpoint),
  ]
);

// Round 29 (renamed from representative_applications same day, to match
// the /accredited-representatives route and the rest of this file's naming)
// — self-enroll applications for the accredited-representatives directory.
// Submissions land here, not in accreditedRepresentativeDirectory below —
// same split round 27/28 established for attorneys: nothing here is ever
// auto-published, Peter manually vets each one (confirms the DOJ/BIA
// accreditation is real and current) before it's promoted to the public
// directory table. Not encrypted — this is business contact info an
// applicant is voluntarily submitting to be listed publicly if approved,
// not private case data.
export const accreditedRepresentativeApplications = pgTable("accredited_representative_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  accreditationDetails: text("accreditation_details").notNull(),
  statesServed: text("states_served").notNull(),
  practiceFocus: text("practice_focus").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// New table, same day — the actual public, approved accredited-representative
// listings. Unlike the attorney directory (still a hand-edited static array,
// since it's empty pending real self-enrolled attorneys), this one is a real
// DB table because it's machine-seeded from DOJ's own public roster at real
// volume (see scripts/seed-accredited-representatives.ts) — a static array
// isn't practical to maintain by hand at this size, and the roster itself
// needs periodic re-seeding (DOJ refreshes it roughly weekly), which a table
// supports far better than hand-editing source code. One row per accredited
// representative (not per organization) — an org can have several reps, each
// gets their own permalink at /accredited-representatives/[slug]. Not
// encrypted — this is DOJ's own already-public data.
export const accreditedRepresentativeDirectory = pgTable(
  "accredited_representative_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    representativeName: text("representative_name").notNull(),
    dhsOnly: boolean("dhs_only").notNull(),
    accreditationExpiration: text("accreditation_expiration"),
    accreditationPendingRenewal: boolean("accreditation_pending_renewal").notNull().default(false),
    organizationName: text("organization_name").notNull(),
    organizationStatus: text("organization_status").notNull(),
    organizationRecognitionExpiration: text("organization_recognition_expiration"),
    organizationRecognitionPendingRenewal: boolean("organization_recognition_pending_renewal")
      .notNull()
      .default(false),
    officeType: text("office_type"),
    streetAddress: text("street_address"),
    cityStateZip: text("city_state_zip"),
    phone: text("phone"),
    state: text("state").notNull(),
    // e.g. "DOJ EOIR Recognized Organizations and Accredited Representatives
    // Roster, current as of 08/30/26" — shown on every seeded entry per the
    // seed task's own trust requirement (same instinct as CW-31's KB citing
    // sources directly, not folding them silently into prose).
    sourceCitation: text("source_citation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("accredited_representative_directory_slug_unique").on(table.slug),
    index("accredited_representative_directory_state_idx").on(table.state),
  ]
);

// Round 28 — self-enroll applications for the attorney directory
// (src/lib/attorneys/directory.ts). Submissions land here, not in the
// public directory file itself — same reasoning as representativeApplications
// above: nothing here is ever auto-published, Peter manually vets each one
// (confirms active bar admission/good standing) before adding a one-line
// entry to the directory file. Not encrypted, same reasoning as above.
export const attorneyApplications = pgTable("attorney_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  firm: text("firm").notNull(),
  statesLicensed: text("states_licensed").notNull(),
  barNumber: text("bar_number").notNull(),
  practiceAreas: text("practice_areas").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  // Round 40 — an attorney submitting their own listing obviously knows
  // their own site; added so self-enroll approvals can carry a website the
  // same way machine-seeded (board-certified) entries do.
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 34 — self-enroll applications for the legal-aid/nonprofit directory
// (entity type 3 of the six-entity "Get Help" system). Same split as every
// other entity type: nothing here is ever auto-published, Peter manually
// vets each one before adding it to legalAidDirectory below. Not encrypted,
// same reasoning as the other applications tables.
export const legalAidApplications = pgTable("legal_aid_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationName: text("organization_name").notNull(),
  orgType: text("org_type").notNull(),
  contactPerson: text("contact_person").notNull(),
  statesServed: text("states_served").notNull(),
  populationServed: text("population_served").notNull(),
  servicesOffered: text("services_offered").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 34 — the public, approved legal-aid/nonprofit org listings.
// Machine-seeded from the same DOJ EOIR roster as accreditedRepresentative-
// Directory (round 29/32/35), pulling the *organization* rows rather than
// individual representatives — DOJ recognition of the organization itself is
// the vetting mechanism, same reasoning that let accredited representatives
// be machine-seeded rather than hand-curated like the attorney directory.
// One row per organization (its Principal Office, or first-listed office if
// no address is explicitly marked "Principal Office" — same simplification
// already disclosed for accredited representatives: a multi-office org's
// other locations aren't separately represented). orgType/contactPerson/
// populationServed/servicesOffered are nullable because DOJ's roster has no
// such fields at all — they're always null from this seed, present only so
// a future manual-curation pass (or an approved self-enroll application)
// can fill them in without a schema change. Not encrypted — DOJ's own
// already-public data, same as accreditedRepresentativeDirectory.
export const legalAidDirectory = pgTable(
  "legal_aid_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    organizationName: text("organization_name").notNull(),
    orgType: text("org_type"),
    contactPerson: text("contact_person"),
    populationServed: text("population_served"),
    servicesOffered: text("services_offered"),
    organizationStatus: text("organization_status").notNull(),
    organizationRecognizedDate: text("organization_recognized_date"),
    organizationRecognitionExpiration: text("organization_recognition_expiration"),
    organizationRecognitionPendingRenewal: boolean("organization_recognition_pending_renewal")
      .notNull()
      .default(false),
    officeType: text("office_type"),
    streetAddress: text("street_address"),
    cityStateZip: text("city_state_zip"),
    phone: text("phone"),
    state: text("state").notNull(),
    sourceCitation: text("source_citation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("legal_aid_directory_slug_unique").on(table.slug),
    index("legal_aid_directory_state_idx").on(table.state),
  ]
);

// Round 40 — attorney directory converted from a static, hand-edited,
// deliberately-empty array (round 27) to a real DB table, machine-seeded
// from official state-bar board-certification records (Florida, Texas,
// North Carolina — the only three states with a formal immigration-law
// specialty certification found in research; see
// attorney-directory-self-sourcing-research-sep9.md). Board certification
// by a state-created regulatory body is the vetting mechanism here, the
// same reasoning that already let accredited representatives and legal aid
// orgs be machine-seeded rather than hand-curated. Self-enrollment
// (attorney_applications, unchanged) remains the path for every attorney
// outside these three states' certified lists.
//
// statesLicensed/practiceFocus are comma-joined text, not a Postgres array
// column (this schema hasn't used array columns before; kept consistent
// with the free-text convention already used in attorneyApplications
// rather than introducing a new column type for one table). Parsed back
// into an array in src/lib/attorneys/directory.ts for <StateFilter>.
// websiteUrl is nullable — round 40's own research found none of the three
// source directories reliably publish one; populated where the source
// actually provided it (confirmed present for Texas, absent for Florida/NC),
// never guessed or backfilled from a second source.
export const attorneyDirectory = pgTable(
  "attorney_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    firm: text("firm"),
    statesLicensed: text("states_licensed").notNull(),
    barNumber: text("bar_number"),
    practiceFocus: text("practice_focus").notNull(),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    email: text("email"),
    streetAddress: text("street_address"),
    cityStateZip: text("city_state_zip"),
    sourceCitation: text("source_citation"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("attorney_directory_slug_unique").on(table.slug)]
);
