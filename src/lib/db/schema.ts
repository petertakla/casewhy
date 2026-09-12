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
    // Round 46 — "active" is polled by the cron job and counted toward
    // AI/chat quota; "pending_review" is neither, until an admin approves
    // the account past CaseWhy Plus's 10-case auto-approved band. Free-tier
    // rows are always "active" — the review-band system is Plus-only.
    status: text("status").notNull().default("active"),
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
  // Round 46 — Plus's case-tracking cap, gated-unlimited: null means "use
  // TIER_LIMITS.plus.maxCases" (10, the auto-approved band); set to 25 once
  // an admin approves a threshold-crossing request. Never set for free-tier
  // accounts — that tier has its own flat cap with no review bands.
  effectiveMaxCases: integer("effective_max_cases"),
  // Set when an 11th+ case first lands as pending_review (the "threshold
  // crossing" moment), so the admin-notification email only fires once per
  // crossing rather than once per pending case. A single-use, unguessable
  // token embedded in the one-click approve link — not literally Neon
  // Auth's own magic-link mechanism (that's scoped to authenticating a
  // specific user's sign-in session, not administering an unrelated batch
  // approval action), but the same "long random token, no new auth system"
  // pattern. Cleared on use.
  pendingApprovalToken: text("pending_approval_token"),
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

// Round 50 — table-driven CaseWhy Plus pricing. `plan_prices` holds each
// plan's base price; `pricing_rules` holds date-ranged discounts on top of
// it, so a future price change is a data change (via
// scripts/set-pricing-rule.ts) rather than a code deploy. Checkout computes
// the effective price at session-creation time via inline Stripe
// `price_data` (see src/lib/billing/pricing.ts) — no per-price-point Stripe
// Price objects to manage. A base-price change only affects new
// signups — existing Stripe Subscription objects keep charging whatever
// they were created with (Peter's explicit decision, no migration path).
export const planIdEnum = pgEnum("plan_id", ["plus_monthly", "plus_quarterly", "plus_annual"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["month", "year"]);
export const pricingAdjustmentTypeEnum = pgEnum("pricing_adjustment_type", ["fixed_amount", "percent"]);

export const planPrices = pgTable("plan_prices", {
  planId: planIdEnum("plan_id").primaryKey(),
  basePriceCents: integer("base_price_cents").notNull(),
  billingInterval: billingIntervalEnum("billing_interval").notNull(),
  // 1 for monthly/annual, 3 for quarterly (Stripe's recurring interval is
  // interval + interval_count, not a native "quarter" unit).
  intervalCount: integer("interval_count").notNull(),
});

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: planIdEnum("plan_id").notNull(),
    adjustmentType: pricingAdjustmentTypeEnum("adjustment_type").notNull(),
    // Interpreted per adjustmentType: cents to subtract for "fixed_amount",
    // basis points off (1000 = 10%) for "percent" — both plain integers to
    // avoid float rounding error, same convention Stripe itself uses for
    // amounts.
    adjustmentValue: integer("adjustment_value").notNull(),
    effectiveStart: timestamp("effective_start", { withTimezone: true }).notNull(),
    // Null = open-ended (no end date).
    effectiveEnd: timestamp("effective_end", { withTimezone: true }),
    label: text("label").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("pricing_rules_plan_id_idx").on(table.planId)]
);

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
  // Round 59 — a short human-readable summary if this applicant's name+state
  // matched an entry on EOIR's disciplined-practitioners list at submission
  // time (see src/lib/discipline/match.ts). Null means no match, not "not
  // checked" — never auto-rejected, just surfaced prominently in the
  // notification email so Peter sees it before manually reviewing.
  disciplineMatchNote: text("discipline_match_note"),
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
  // Round 59 — see accreditedRepresentativeApplications' own comment above.
  disciplineMatchNote: text("discipline_match_note"),
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

// Round 43 — self-enroll applications for the DSO (university international
// student office) directory, entity type 4 of the six-entity "Get Help"
// system. Same split as every other entity type: nothing here is ever
// auto-published. Since DHS's own school-search data has no DSO contact
// info at all (round 43's own research — no bulk source anywhere has it,
// it's a staff role with no federal registry), this application form is
// also how an existing machine-seeded school row gets a real named contact
// filled in later, not just how a brand-new school gets added.
export const dsoApplications = pgTable("dso_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  schoolName: text("school_name").notNull(),
  campusName: text("campus_name"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 43 — the public DSO directory. Machine-seeded from DHS's own
// "Study in the States" School Search (studyinthestates.dhs.gov), SEVP
// certification itself is the vetting mechanism (a federally-certified
// school, same category of official record as every other entity type's
// source). Scoped to Education Type = Higher Education only, not all
// 13,839 SEVP-certified institutions nationwide (which includes K-12
// private schools, flight schools, language institutes) — a deliberate,
// documented narrowing since "university international student offices"
// is this entity type's own stated framing, not general SEVP coverage.
// No websiteUrl field populated from the source (DHS's data has none) —
// left null rather than guessed/constructed, same discipline as round 40's
// attorney websiteUrl; dsoApplications above is the path to a real one.
export const dsoDirectory = pgTable(
  "dso_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    schoolName: text("school_name").notNull(),
    campusName: text("campus_name"),
    isMainCampus: boolean("is_main_campus").notNull().default(false),
    f1Certified: boolean("f1_certified").notNull().default(false),
    m1Certified: boolean("m1_certified").notNull().default(false),
    streetAddress: text("street_address"),
    cityStateZip: text("city_state_zip"),
    state: text("state").notNull(),
    phone: text("phone"),
    websiteUrl: text("website_url"),
    dataSource: text("data_source").notNull().default("dhs_study_in_the_states"),
    sourceCitation: text("source_citation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("dso_directory_slug_unique").on(table.slug),
    index("dso_directory_state_idx").on(table.state),
  ]
);

// Round 43 — self-enroll applications for the community/cultural
// organization directory, entity type 5. Same shape as legalAidApplications.
export const communityOrgApplications = pgTable("community_org_applications", {
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
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 43 — the public community/cultural organization directory.
// Machine-seeded from USCIS's own Citizenship and Integration Grant
// Program (CIGP) recipient records (FY22-24) — a real federal grant award
// is the vetting mechanism, same category of official record as every
// other entity type's source. Explicitly partial coverage (grant winners
// only, not all community/cultural organizations) — sourceCitation states
// this plainly on every row, same honesty standard as attorneys' 3-state
// board-certification list. No street address in the source (only
// city/state) and no website field — left null rather than guessed,
// communityOrgApplications above is the path to a real one.
export const communityOrgDirectory = pgTable(
  "community_org_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    organizationName: text("organization_name").notNull(),
    cityStateZip: text("city_state_zip"),
    state: text("state").notNull(),
    description: text("description"),
    fiscalYearsAwarded: text("fiscal_years_awarded").notNull(),
    websiteUrl: text("website_url"),
    dataSource: text("data_source").notNull().default("uscis_cigp"),
    sourceCitation: text("source_citation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("community_org_directory_slug_unique").on(table.slug),
    index("community_org_directory_state_idx").on(table.state),
  ]
);

// Round 58 — self-enroll applications for the pro bono immigration-court
// representation directory, entity type 7. Fields differ from the other
// applications tables since this list's real focus is EOIR-court-specific
// pro bono representation, not general legal aid.
export const proBonoRepresentationApplications = pgTable("pro_bono_representation_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationName: text("organization_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  immigrationCourtsServed: text("immigration_courts_served").notNull(),
  languages: text("languages"),
  caseTypeLimits: text("case_type_limits"),
  intakePolicy: text("intake_policy"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  // Round 59 — screened against contactPerson (an individual's name), not
  // organizationName — see accreditedRepresentativeApplications' own
  // comment above for what this field means. No state field exists on this
  // form to narrow the match against, so this entity type's matches are
  // name-only — a real, honestly-noted limitation, not silently ignored.
  disciplineMatchNote: text("discipline_match_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Round 58 — the public pro bono immigration-court representation
// directory, the 7th Get Help entity type. Machine-seeded from EOIR's own
// quarterly "List of Pro Bono Legal Service Providers"
// (justice.gov/eoir/file/probonofulllist/download), organized by
// immigration court rather than state directly — state is derived from
// which court section an entry sits under. Deliberately a standalone
// entity type, not merged into legalAidDirectory — EOIR's own page states
// it "does not endorse" these listings (a meaningfully weaker guarantee
// than legalAidDirectory's DOJ recognition), and the data shape is
// genuinely different (immigration-court jurisdiction, languages,
// walk-in/appointment intake policy, case-type limits aren't fields DOJ
// recognition data has or needs). Real overlap with legalAidDirectory/
// accreditedRepresentativeDirectory is expected and not deduped away —
// see CLOUD_CLAUDE.md "Round 58" for the confirmed overlap figure. Not
// encrypted — EOIR's own already-public data.
export const proBonoRepresentationDirectory = pgTable(
  "pro_bono_representation_directory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    organizationName: text("organization_name").notNull(),
    streetAddress: text("street_address"),
    cityStateZip: text("city_state_zip"),
    state: text("state").notNull(),
    immigrationCourt: text("immigration_court").notNull(),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    languages: text("languages"),
    caseTypeLimits: text("case_type_limits"),
    intakePolicy: text("intake_policy"),
    isReferralService: boolean("is_referral_service").notNull().default(false),
    sourceCitation: text("source_citation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("pro_bono_representation_directory_slug_unique").on(table.slug),
    index("pro_bono_representation_directory_state_idx").on(table.state),
  ]
);

// Round 59 — a cached copy of EOIR's own "List of Currently Disciplined
// Practitioners" (justice.gov/eoir/list-of-currently-disciplined-
// practitioners), a real HTML table (not a downloadable file), refreshed by
// scripts/refresh-disciplined-practitioners.ts (delete-and-reseed, same
// pattern as every other directory). Cached rather than fetched live on
// every application/recheck so a single EOIR outage or slow response can't
// block a real applicant, and so the matching logic (src/lib/discipline/
// match.ts) doesn't need network access. states is a comma-separated list
// of 2-letter codes derived from the source's free-text city/state field
// (which mixes "City, ST", "State1/State2", and bare state-name formats) —
// derived once at scrape time so matching doesn't re-parse it per lookup.
export const disciplinedPractitioners = pgTable(
  "disciplined_practitioners",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    cityState: text("city_state").notNull(),
    states: text("states").notNull(),
    dateImmediateSuspension: text("date_immediate_suspension"),
    finalDisciplineImposed: text("final_discipline_imposed"),
    effectiveDate: text("effective_date"),
    reinstated: boolean("reinstated").notNull().default(false),
    sourceCitation: text("source_citation").notNull(),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("disciplined_practitioners_normalized_name_idx").on(table.normalizedName)]
);

// Round 41 — "report incorrect information" on every live Get Help listing
// (attorneys, accredited representatives, legal aid; future entity types
// per partner-marketing-domain-concept.md's standing template). A report
// queue, not an auto-edit/auto-removal — nothing here ever changes a live
// listing on its own, same "manual review before anything public changes"
// principle already used for join-form applications. entityName is a
// denormalized snapshot taken at report time (not a live join) so a report
// stays readable even if the listing it's about is later edited or removed.
// entityType is plain text, not a pgEnum, so a new entity type can start
// filing reports without a migration — validated against a known set in
// src/lib/reports/report.ts instead.
export const listingReports = pgTable("listing_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  reportText: text("report_text").notNull(),
  reporterEmail: text("reporter_email"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const policyTypeEnum = pgEnum("policy_type", ["tos", "privacy"]);

// Round 69, Part 1 — closes the "active consent" gap in USCIS's Developer
// Portal Affidavit privacy/ToS checklist (privacy.html Section 10 / terms.html
// Section 15 previously only promised an email on material changes, which
// satisfies "notify," not "active consent"). One row per explicit
// acknowledgment click — src/lib/policy/acknowledgments.ts is the only
// writer. `version` is the literal "Last updated" date string from the
// corresponding static page (src/lib/policy/versions.ts), reusing that
// existing convention rather than inventing a separate version scheme.
export const policyAcknowledgments = pgTable(
  "policy_acknowledgments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    policyType: policyTypeEnum("policy_type").notNull(),
    version: text("version").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("policy_acknowledgments_user_id_idx").on(table.userId)]
);

// Round 69, Part 2 — append-only case status-history logging, data-capture
// groundwork for CW-33(b)'s comparative analytics (still deferred as a
// *feature* — this table just stops that future feature from being blocked
// on "we never logged it"). servicePrefix (not the full receipt number) is
// deliberately the only case-identifying field here, so a future aggregate
// query never needs to join back to a specific user's tracked case to be
// useful.
//
// Round 71 — widened + repurposed from "one row per detected change" to
// "one row per real USCIS history entry, plus one row for the live current
// status." USCIS's own case_status response includes a hist_case_status
// array (confirmed real, not guessed, against a live sandbox call at the
// original scaffold's build time — see the header comment in
// src/lib/uscis/client.ts) that round 69 discarded entirely except for a
// milestone-keyword scan. src/lib/uscis/check-status.ts's recordCaseHistory()
// now upserts every entry it finds (statusText/eventDate keyed,
// onConflictDoNothing — safe to call on every check, including the very
// first one right after tracking, without duplicating). New fields only
// exist where USCIS's real response actually has the data:
// statusDescription (current_case_status_desc_en — only present for the
// live current-status row, hist_case_status entries don't carry a separate
// description) and filingDate (submittedDate — a case-level fact, same
// value repeated across a case's rows, absent for IOE-prefixed receipts).
// `source` is CaseWhy's own bookkeeping (not USCIS data), same precedent as
// the pre-existing detectedAt column.
export const caseStatusHistory = pgTable(
  "case_status_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    trackedCaseId: text("tracked_case_id").notNull(),
    caseType: text("case_type"),
    // The 3-letter USCIS service-center prefix only (e.g. "EAC") — a
    // coarse regional signal, never the full receipt number a second time.
    servicePrefix: text("service_prefix").notNull(),
    statusText: text("status_text").notNull(),
    // Real, from current_case_status_desc_en — only populated for the row
    // representing the live current status; hist_case_status entries don't
    // include a separate description, so null there.
    statusDescription: text("status_description"),
    // The USCIS-reported date this specific entry corresponds to: a
    // hist_case_status entry's own `date` for a historical row, or
    // modifiedDate for the live current-status row. Null when USCIS didn't
    // provide one (e.g. IOE-prefixed receipts omit modifiedDate).
    eventDate: timestamp("event_date", { withTimezone: true }),
    // Real, from submittedDate — a case-level fact (filing date), the same
    // value repeated across a case's rows. Null for IOE-prefixed receipts.
    filingDate: timestamp("filing_date", { withTimezone: true }),
    // Set only when this entry's own text matches an interview/oath-ceremony
    // milestone keyword (MILESTONE_KEYWORDS, src/lib/escalation/stall-detector.ts)
    // — null on most rows.
    milestoneDate: timestamp("milestone_date", { withTimezone: true }),
    // CaseWhy's own bookkeeping, not USCIS data: "history_sync" for a row
    // backfilled/synced from hist_case_status, "current_status" for the row
    // representing the live current status as of this check.
    source: text("source").notNull().default("history_sync"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("case_status_history_tracked_case_id_idx").on(table.trackedCaseId),
    // Dedup key — lets recordCaseHistory() safely re-run on every check
    // (including the first one right after tracking) without ever
    // inserting the same entry twice.
    unique("case_status_history_dedup_unique").on(
      table.trackedCaseId,
      table.statusText,
      table.eventDate
    ),
  ]
);

export const aliasActionLevelEnum = pgEnum("alias_action_level", ["draft_only", "draft_and_flag_urgent"]);

// Round 70 — one row per casewhy.com response alias (privacy@, security@,
// etc, all Workspace aliases on the same info@casewhy.com inbox — see the
// task doc for why this project deliberately doesn't provision separate
// mailboxes). Editable without a code change, per Peter's own explicit
// point that monitoring/response cadence needs to be customizable per
// alias — this table is that config, not a hardcoded map.
export const emailAliasConfigs = pgTable("email_alias_configs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // The local part only (e.g. "privacy", not "privacy@casewhy.com") —
  // the domain is always casewhy.com, enforced in application code.
  alias: text("alias").notNull().unique(),
  purpose: text("purpose").notNull(),
  // Gmail label applied by that alias's filter (e.g. "Alias/Privacy") —
  // this is what the poller actually queries against, not the alias
  // string itself, since Gmail search is label-based here.
  gmailLabel: text("gmail_label").notNull(),
  pollIntervalMinutes: integer("poll_interval_minutes").notNull(),
  actionLevel: aliasActionLevelEnum("action_level").notNull().default("draft_only"),
  enabled: boolean("enabled").notNull().default(true),
  // Null until the poller's first real run against this alias.
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pendingAliasActionStatusEnum = pgEnum("pending_alias_action_status", [
  "pending",
  "approved",
  "rejected",
  "sent",
]);

// Round 70 — the approval queue itself. Nothing here is ever sent or
// executed by the poller that creates a row — only the approve action
// (src/app/admin/inbox/actions.ts) does that, and only on a real click.
// This table is the entire enforcement mechanism for "never auto-send,"
// not just a UI convention layered on top of something that could act
// on its own.
export const pendingAliasActions = pgTable(
  "pending_alias_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    aliasConfigId: text("alias_config_id").notNull(),
    gmailMessageId: text("gmail_message_id").notNull().unique(),
    fromAddress: text("from_address").notNull(),
    subject: text("subject").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    summary: text("summary").notNull(),
    draftReply: text("draft_reply"),
    proposedAction: text("proposed_action"),
    status: pendingAliasActionStatusEnum("status").notNull().default("pending"),
    // Mirrors the parent alias config's actionLevel at creation time (not
    // a live join) so a later config edit can't silently change how an
    // already-queued item is triaged.
    urgent: boolean("urgent").notNull().default(false),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("pending_alias_actions_alias_config_id_idx").on(table.aliasConfigId),
    index("pending_alias_actions_status_idx").on(table.status),
  ]
);
