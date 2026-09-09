# New task for Claude Code — round 50: table-driven CaseWhy Plus pricing (base price table first, then Stripe-native promo codes)

**Status: authorized now, Sep 9 — revised same day.** Follows the pricing-tier discussion in `casewhy-plus-pricing-recheck-sep9.md` and the table-driven design doc Peter reviewed (`casewhy-table-driven-pricing-concept.md`). **Peter's revision after first reviewing the full spec: drop the admin web page entirely** — he doesn't want a UI to manage, just wants future price changes to not require a big code change. See "How price changes actually get made" below for what replaced the admin page. Peter's decisions, final:

1. A base-price rule applies to **new signups only** — existing subscribers keep whatever price they originally subscribed at. No migration mechanism, no retroactive re-pricing.
2. Seasonal promos, coupons, and referral discounts run entirely on **Stripe's native Coupons + Promotion Codes** — no custom CaseWhy schema or admin UI for this piece. See Part 2 below.
3. **No refund/proration policy of any kind.** A subscriber who cancels a quarterly or annual plan mid-period gets no partial refund — same "reverts to free tier at the end of the current paid period, not instantly" behavior round 13 already built for monthly, just confirmed to apply identically to the new quarterly/annual plans. Nothing new to build here, but see the disclosure-copy note below — this needs to be stated plainly to the buyer before purchase, not just true in the backend.
4. Final prices: **monthly $9.99** (unchanged), **quarterly (3-month) $22.99** (≈ $7.66/mo, ~23% off the monthly-equivalent rate), **annual (12-month) $66.99** (≈ $5.58/mo, ~44% off the monthly-equivalent rate).
5. Build order: Part 1 (base-price table) first, Part 2 (Stripe promo codes) second — Part 2 is small and low-risk and can ship independently once Part 1 is stable.
6. **No admin web page.** The `plan_prices`/`pricing_rules` tables themselves are still the point of this round — that's the actual "no big code change needed" mechanism — but nobody needs a page to edit them. See below.

## Part 1 — base-price table + quarterly/annual plans

### Schema
- `plan_prices` table: `plan_id` (`plus_monthly` | `plus_quarterly` | `plus_annual`), `base_price_cents`, `billing_interval` (`month` | `year`), `interval_count` (`1` for monthly/annual, `3` for quarterly — Stripe's recurring interval only supports day/week/month/year with a count, so "3 months" is `interval: month, interval_count: 3`). Seed with the three plans above.
- `pricing_rules` table: `id`, `plan_id` (FK to `plan_prices`), `adjustment_type` (`fixed_amount` | `percent`), `adjustment_value` (cents for fixed, basis points or a decimal for percent — pick whichever is less error-prone to store and compute with), `effective_start` (date), `effective_end` (nullable date, open-ended if null), `label` (free text, Peter's own note — e.g. "Black Friday 2026"), `active` (bool), `created_at`.
- No migration needed beyond these two new tables — this doesn't touch `subscriptions`.

### Checkout flow changes
- `startCheckout` (`src/app/plus/actions.ts`) takes a `plan` parameter (`plus_monthly` | `plus_quarterly` | `plus_annual`) instead of assuming monthly.
- At session-creation time, server computes the effective price: `plan_prices.base_price_cents` for the chosen plan, adjusted by whichever `pricing_rules` row (if any) is `active` and has `effective_start <= today <= effective_end` (or `effective_end` is null). If more than one rule is somehow active for the same plan on the same date, log a warning and use the most-recently-created one — but the pricing-rule script's overlap guard below should prevent this from happening in the first place.
- **Verify before building, don't assume:** confirm Stripe's current support for inline `price_data` (with a `recurring` block) on a `line_items` entry in a **subscription-mode** Checkout Session — this lets the server charge a computed amount without pre-creating a Stripe Price object per price point, which is what makes date-ranged/percentage adjustments practical without proliferating Price objects. If that's confirmed working, use it. If Stripe's current API requires a real pre-created Price object for subscription-mode line items, fall back to: create a new Stripe Price object whenever a rule takes effect (at rule-creation time if the effective_start is today or earlier, otherwise the system needs some way to create it exactly when the rule starts — a small scheduled check is simplest) and have checkout reference whichever Price ID is currently correct for that plan. Report back which path was actually used and why, so it's on record rather than needing rediscovery.
- Existing Stripe Subscription objects for current subscribers are untouched by any of this — they keep charging whatever Price/amount they originally subscribed under, per decision #1 above.

### `/plus` page changes
- Add a plan selector: monthly $9.99 / quarterly $22.99 (~$7.66/mo) / annual $66.99 (~$5.58/mo) — show both the period price and the per-month equivalent for each, so the discount is legible at a glance.
- Add a plain, visible **"No refunds, no proration — cancel anytime and you'll keep access through the end of your current billing period"** line near the plan selector/CTA, not buried in a footnote or only in the Terms link. This is a real legal-disclosure requirement (most state auto-renewal laws and the FTC's click-to-cancel rule require billing-frequency/cancellation terms to be clear and conspicuous *before* purchase) — this is on-page checkout-disclosure copy, not a change to `terms.html` itself. **Do not edit `terms.html` as part of this round** — any Terms-of-Service wording change stays gated on Peter's separate sign-off, same standing rule as everywhere else in this project; if this disclosure needs a matching Terms update later, flag it back rather than adding it here.

### How price changes actually get made — no admin page

No `/admin/pricing` route, no form, nothing web-facing. Instead, a small **command-line script** (e.g. `scripts/set-pricing-rule.ts`, run with `tsx` or equivalent, matching whatever pattern the existing seed/backfill scripts in this repo already use) that inserts or deactivates a `pricing_rules` row:

- Takes the plan, adjustment type (`fixed_amount`/`percent`), value, `effective_start`, optional `effective_end`, and a label as CLI args or prompts.
- **Overlap guard lives in the script, not a UI:** before inserting, check for any other `active` rule on the same plan whose date range overlaps the new one, and refuse (printing a clear error) rather than silently creating two simultaneously-active rules for the same plan.
- A second small mode (or a separate script) to list current/past/future rules for a plan, and to deactivate a rule by ID — enough to see what's active and undo a mistake, without a web page.
- This is something Peter (or whichever Claude Code session is handling a given pricing change later) runs directly against the database when a price needs to change — a data change, not a deploy. That's the actual thing being asked for: change the number without a "big change," which the schema + script together deliver without needing a maintained web UI on top.
- No auth/gating needed since this never runs as a web-exposed route — it's a local/ops script only, same trust boundary as any other one-off script already in this repo.

## Part 2 — Stripe-native promo codes (build after Part 1 is stable)

- Turn on `allow_promotion_codes: true` on the Checkout Session creation (all three plans) — Stripe Checkout's built-in "Add promotion code" field handles redemption itself; no CaseWhy-side validation logic needed.
- Confirm in Stripe's dashboard (test mode) that Coupons and Promotion Codes can actually be created and redeemed end-to-end against the new quarterly/annual Prices, not just the existing monthly one.
- No new schema, no admin UI, no referral-tracking build for this round — Peter's decision was to use Stripe's own free tooling for this rather than build a CaseWhy-side referral system. If per-user tracked referral codes become a real want later, that's a separate, explicitly-scoped future round, not part of this one.

## Verify live

Part 1: a real test checkout on each of the three plans (test-mode Stripe), confirming the correct amount is charged for each; run the new script to create a test `pricing_rules` row (e.g., $2 off monthly, dated to cover today) and confirm a *new* test checkout picks up the adjusted price while a separate already-subscribed test account's existing subscription is unaffected; confirm the script's overlap guard actually refuses a conflicting second rule; confirm the "no refunds, no proration" line renders on `/plus` before the CTA. Part 2: a real test Coupon + Promotion Code created in the Stripe test dashboard, redeemed successfully at checkout on at least one of the three plans. `tsc`/lint clean, production build succeeds. Report back — including which inline-price-data vs. pre-created-Price approach was used for Part 1 and why — and fold into `CLOUD_CLAUDE.md`'s standing status.
