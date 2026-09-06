# CaseWhy Plus — Full Live Billing & Marketing Page: Launch Scope

**Status: authorized to build, Sep 6, 2026.** Peter reviewed the current state (no dedicated Plus marketing page exists; only scattered inline upgrade nudges) and gave direct, explicit authorization to build the complete thing this time — a real marketing page for CaseWhy Plus **and** full live Stripe subscription billing, not the schema-only/no-checkout version authorized in round 12. Explicit instruction: full functionality on day one, even if that means pushing the launch date back. This document supersedes the "everything except live billing" boundary set in round 12 (`CLOUD_CLAUDE.md`) and re-opens MVP scope doc Section 6's "still not a green light to charge real money" line — it's now a green light, gated only on the real prerequisites below, not on scope.

## Why this is bigger than a feature build

Every previous round in this project has deliberately stopped short of real billing because three real-world things didn't exist yet: a Florida LLC, a business bank account, and a Stripe (or equivalent) account. Those aren't code tasks — they're Peter's own administrative/legal steps, several of which have external turnaround times measured in days, not hours. The engineering work (Stripe integration, the Plus page, webhooks) can be built and fully tested in Stripe's test mode in parallel, starting immediately, without waiting on any of them. But flipping to *live* keys and taking a real charge is gated on those steps actually completing. That's the real reason "day one, full functionality" means a later launch date, not a bigger sprint.

## Part 1 — Business/legal prerequisites (Peter's steps, not code)

These are sequenced — several genuinely can't be parallelized past a point — and this is the actual critical path for the launch date, not the code.

1. **Florida LLC** — already in motion. Ordered via Northwest Registered Agent (order #88978WW, $164), expected registered **Sep 8, 2026**. Nothing to do here but wait for confirmation.
2. **EIN** — free, self-service at irs.gov, same-day online once the LLC is confirmed. Do this the moment step 1 clears.
3. **Business bank account** — needed as Stripe's payout destination. Traditional banks can take several business days; a digital-first business bank built for new LLCs (e.g., Mercury, Novo, Relay) is usually same-day-to-next-day once the LLC + EIN exist, and is the faster path if speed matters more than an existing banking relationship.
4. **Stripe account** — can be *created* today (account creation doesn't require the LLC to already exist), but full verification and the ability to receive live payouts needs the EIN and a linked business bank account. Stripe's own verification review can range from instant to a few business days depending on the account and how it's categorized (an immigration-adjacent SaaS product may get extra scrutiny — worth starting this early rather than assuming it's instant).
5. **Sales tax handling** — SaaS subscriptions are taxable in a growing number of US states, and the rules vary by state and change over time. Recommendation: turn on **Stripe Tax** at Checkout rather than tracking this by hand — it calculates and can remit the right amount automatically based on the buyer's address, for a small per-transaction fee. This needs to be explicitly enabled and configured, not assumed on by default.
6. **Attorney review of the billing/subscription terms — deferred, Sep 6.** Real risk without it (see the reasoning below), but Peter's explicit call: start the full build now without waiting on this, and revisit it before flipping to live keys rather than letting it block the start. The current live Terms of Service (Section 5, already published at casewhy.com/terms.html) describes CaseWhy Plus billing in general terms but was drafted and published without attorney review, per Peter's own earlier explicit call to ship it as final. That was a reasonable, lower-stakes call for a document that wasn't yet gating real charges. Once CaseWhy is actually taking money every month, the exposure is different: most US states have "automatic renewal" / negative-option laws (and the FTC's "click-to-cancel" rule) that require specific, clear-and-conspicuous disclosures about price, billing frequency, and how to cancel — shown *before* purchase, not just buried in a ToS link. Getting this reviewed (budgeted at ~$500-1,500 in the original MVP scope doc, never spent) would meaningfully de-risk real chargebacks/disputes/regulatory complaints, whenever Peter decides to pursue it.
7. **PCI compliance stance** — resolved by design choice, not by extra work: build the checkout using Stripe's own hosted Checkout page (redirect, not an embedded card form). Card data never touches CaseWhy's servers this way, which keeps CaseWhy in the simplest PCI self-assessment category (SAQ A) automatically. No separate PCI work needed as long as this design choice holds.

**None of steps 2-6 block starting the code build below — they run in parallel with it, starting now.**

## Part 2 — Technical build (Claude Code)

### Database (`src/lib/db/schema.ts`)
Extend the existing `subscriptions` table (already has `userId`, `tier`) with: `stripeCustomerId`, `stripeSubscriptionId`, `status` (Stripe's own subscription status values: `active`, `past_due`, `canceled`, `incomplete`, etc.), `currentPeriodEnd`, `cancelAtPeriodEnd`. A new migration, same pattern as CW-35/36's.

### Checkout flow
- "Subscribe to CaseWhy Plus" action (from the new `/plus` page and from the existing inline upgrade nudges, all pointing to the same flow) creates a Stripe Checkout Session server-side (`mode: "subscription"`, the Plus price ID, `automatic_tax: { enabled: true }`, success/cancel URLs back into the app) and redirects the signed-in user to Stripe's hosted page.
- On the success redirect, show a confirmation state — but treat the **webhook**, not the redirect, as the source of truth for actually flipping the account to Plus (a user can close the tab before the redirect completes; the webhook always fires).

### Webhook handler (`POST /api/webhooks/stripe`, new)
Verifies the Stripe signature against `STRIPE_WEBHOOK_SECRET` and handles, idempotently (dedupe on Stripe's event ID):
- `checkout.session.completed` → create/update the `subscriptions` row, set `tier: "plus"`.
- `customer.subscription.updated` → sync `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`.
- `customer.subscription.deleted` → set `tier: "free"`.
- `invoice.payment_failed` → mark `past_due`; a grace period before actually downgrading (recommend 3-7 days, matching Stripe's own default retry schedule) rather than an instant hard downgrade on the first failed card.

### Customer portal (self-service cancel / update payment method)
A "Manage subscription" action creates a Stripe Billing Portal session and redirects there — Stripe's own hosted UI handles cancellation, payment method updates, and invoice history. This is what satisfies the "easy to cancel" requirement, not a custom-built cancel flow.

### Downgrade behavior — decided, Sep 6
When a Plus subscriber cancels, or a payment fails and isn't recovered, **the subscription stays fully active through the end of the period already paid for, then reverts to free-tier limits** — never an instant downgrade at the moment of cancellation or the moment a charge fails. In Stripe terms: a cancellation just sets `cancel_at_period_end`, and Plus access continues until the period genuinely ends; a failed payment goes through Stripe's own retry schedule as `past_due` with Plus access intact, and only downgrades once Stripe actually ends the subscription. For the 5-case cap specifically: on downgrade, keep cases 2-5 in the database rather than deleting them — just stop polling/allowing interaction with them beyond the free tier's 1-case limit, so resubscribing later restores access without re-entering anything.

### The `/plus` page itself
A real marketing/conversion page, not just a pricing blurb:
- Full feature breakdown, grouped clearly: unlimited AI chat (vs. 10/month free), multi-case family tracking (up to 5, vs. 1 free), on-demand status checks, the document vault, and the full escalation toolkit (representative lookup + all three letter-drafting assistants — noting the stalled-case *detector* itself stays free on every tier, only the tools that follow it are Plus).
- Clear price ($9.99/mo) and billing cadence shown plainly near the CTA, not just in a linked ToS — this is both good marketing practice and the auto-renewal-law disclosure requirement in one place.
- A short FAQ: cancel anytime (and how), what happens on downgrade, "is this legal advice" (no — same UPL guardrail language as everywhere else in the product).
- CTA behavior: signed-out visitor → sign in first, then straight into Checkout; signed-in free-tier user → straight into Checkout; already-Plus user → straight into the customer portal instead of a duplicate checkout.
- Link to it from the main nav/dashboard persistently, not just the scattered inline nudges (those can stay as-is but should now also deep-link here for the full picture instead of just unlocking their one feature).

### Testing (in Stripe test mode, before any live key exists)
Full round trip: subscribe with a Stripe test card → webhook fires → tier flips to `plus` → every gated feature actually unlocks (dashboard case cap, chat limit, document vault, escalation toolkit) → cancel via the portal → webhook fires → tier reverts to `free` at period end, not instantly (unless that's the intended behavior — worth confirming). Also test Stripe's documented decline/failure test cards to exercise the `past_due` path, and confirm a tampered/unsigned webhook request is correctly rejected.

## Part 3 — Sequencing and a realistic date

The code above can start immediately and largely finish in test mode within days, based on how fast CW-35 through CW-40 shipped. The real gate is Part 1's chain: LLC (expected Sep 8) → EIN (same day) → business bank account (allow up to a week if going the traditional-bank route, faster with a digital-first business bank) → Stripe verification (allow a few more days) → attorney review, if Peter chooses to get one (the least predictable step — depends entirely on attorney availability).

**Recommended pushed-back paid-launch target: late September to early October 2026** — comfortably covers the bank account and Stripe verification steps even if they run on the slower end, and leaves room for an attorney review without that becoming the thing that blows the date. This is a recommendation, not a fixed deadline; it should firm up once Part 1's steps 3-4 have real dates.

## What's authorized vs. what still needs a decision

**Authorized now:** the full technical build in Part 2, entirely in Stripe test mode. Peter starting Part 1's steps 2-5 (EIN, bank account, Stripe account creation/verification, Stripe Tax setup) as soon as each becomes available to start.

**Decided, Sep 6:** the downgrade behavior (Part 2) and the attorney-review timing (Part 1, step 6 — deferred, tracked, not blocking) are both resolved above.

**Still needs a decision from Peter:**
- Final go/no-go on flipping from Stripe test keys to live keys — this should be an explicit, deliberate switch once Part 1 is actually done, not something that happens automatically when the code is ready.
