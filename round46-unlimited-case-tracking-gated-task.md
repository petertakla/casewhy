# New task for Claude Code — round 46: CaseWhy Plus case tracking — market as unlimited, gate technically

**Status: authorized now.** Peter's decision, following the Sep 9 pricing recheck (`casewhy-plus-pricing-recheck-sep9.md`): don't keep a flat numeric cap as the public story — market CaseWhy Plus as unlimited case tracking, but back it with a technical review gate above a threshold, rather than either a hard wall at a fixed number or true, ungated unlimited.

## Correction first: the live cap is 10, not 5

The cap this round modifies is `TIER_LIMITS.plus.maxCases` in `src/lib/billing/tier.ts`, currently **10** (raised from 5 in round 17 — `casewhy-competitor-review-sep6-changes-to-consider.md` and `immigration-case-companion-mvp-scope.md` Section 6 still say 5 in a couple of places; those are stale doc references, not a live discrepancy — this round's copy sweep should catch any of those "5"/"10" mentions still visible in-app, same as round 17's own sweep did).

## Why gated-unlimited, not a flat cap or true unlimited

Two real constraints, not just a hunch:

1. **Reselling economics** — the original reason any cap existed at all (`casewhy-competitor-review-sep6-changes-to-consider.md` item 1): a flat-rate $9.99/mo account with truly unlimited tracking could be informally resold/shared across an unrelated group, undercutting per-subscription pricing. A pure numeric cap solves this bluntly; true unlimited removes the guardrail entirely.
2. **Shared USCIS API quota** — the daily cron job (`POST /api/cron/check-status`) polls every *tracked* case against USCIS's production Case Status API, and that quota (10,000 lookups/day, 10 transactions/second per the affidavit terms) is shared across CaseWhy's entire user base, not per-account. Uncapped per-account tracking — even from a good-faith large household, not just abuse — could eat disproportionately into a budget meant to serve everyone.

The design below addresses both by making the *review gate itself* the thing that keeps a case from being polled until it's approved — one mechanism, not two.

## The three bands

- **1-10 cases: unchanged, auto-approved, exactly today's live behavior.** No new friction for the overwhelming majority of real users.
- **11-25 cases: queued for review, not silently blocked and not silently polled.** Adding an 11th+ case creates the row in a new `pending` status — visible on the user's own dashboard as "Pending review," with plain copy explaining why (something like: "Tracking more than 10 cases needs a quick check — we'll email you within 1 business day"). **A pending case is never polled by the cron job and never counted toward AI/email usage** — it doesn't touch the shared USCIS quota until approved. On crossing the threshold, send a single admin-notification email (Postmark, same low-overhead pattern as every other admin notification in this app — no new dashboard) with a one-click approve link (reuse the existing magic-link token infrastructure rather than building new auth). **Approving raises that account's effective cap to 25, not one case at a time** — the account is now trusted up to the second ceiling, not re-queued on every subsequent addition.
- **Above 25: a hard technical ceiling, not a bigger review queue.** The UI doesn't offer a way to request more via the normal add-a-case flow at all past this point — instead, a plain "Need to track more than 25 cases? Contact us" message and a link to `hello@casewhy.com`. This is a genuinely different use case (bulk/organizational use) that belongs in a real conversation, not an auto-granted extension of an individual consumer tier — and it's the natural on-ramp to the still-undecided Employers/team-accounts idea (`partner-marketing-domain-concept.md`) rather than something to stretch Plus itself to cover.

These three numbers (10/25/25) are Peter's-recommendation defaults, not fixed forever — flag them as easily tunable constants, and note in a code comment that the review-band and hard-ceiling numbers are worth revisiting once the still-pending scalability audit (`casewhy-scalability-capacity-audit-task.md`) reports real USCIS-quota headroom, rather than being treated as permanent.

## Schema

Extend `tracked_cases` (or wherever the per-case row lives) with a `status` column: `active` (polled normally), `pending_review` (visible, not polled, not counted), and reuse existing removal for anything a user deletes. Add whatever's needed to track an account's `effectiveMaxCases` (defaults to `TIER_LIMITS.plus.maxCases`, i.e. 10; set to 25 on approval) — a simple column on the subscription/account row, not a new table.

## Marketing copy

`/plus` page and any "up to 10 cases" / "5-case family plan" copy found in the round-17 sweep → reframe around **"Unlimited case tracking for your family"** (or similar — keep it in the same register as the rest of the page, don't oversell). Add one honest, short line near the feature description — not buried — noting that tracking beyond typical household size may need a quick verification step, so the "unlimited" claim isn't misleading once someone actually hits the gate. **This exact wording is content, not a Terms of Service change** — draft it as part of this round's copy work, but if it needs to also land in `terms.html`'s existing CaseWhy Plus billing section, that specific insertion stays gated on Peter's standing sign-off for ToS changes (same rule as every other Terms edit on this project) — flag it back rather than pushing it there directly.

## Verify live

Confirm: cases 1-10 behave exactly as today (no regression); an 11th case lands as `pending_review`, doesn't appear in the cron job's poll list, and doesn't consume AI/chat quota; the admin email fires once per threshold-crossing (not once per case) with a working one-click approve link; approving actually raises the account to the 25 ceiling and its pending cases (all of them, not just the triggering one) flip to `active` and get picked up by the next poll; an account already at 25 sees the "contact us" message instead of a form past that point; `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status, including an explicit note correcting any remaining "5-case" references found during the copy sweep.
