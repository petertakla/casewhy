# Get Help directory — keeping all six lists current (Sep 9)

**Status: decided.** Peter's question: is there a process to keep the directory data updated, to avoid liability from stale listings? Applies to all six entity types, per his follow-up, not just attorneys. **Decided Sep 9: reporting-and-reviewing individual flags isn't feasible with limited resources as a solo founder — the process is a complete, automated periodic refresh instead of a diff that waits for manual review.** Confirmed cadence: **quarterly for DOJ-sourced listings** (accredited representatives + legal aid orgs), **annually for board-certification-sourced attorney listings** (FL/TX/NC). Round 42 (`round42-directory-refresh-pipeline-task.md`) builds the mechanism; the cloud session is setting up the two recurring schedules. Round 41's report-a-listing feature stays live as a secondary, passive signal, not the primary mechanism.

## Short answer: not yet — this has been flagged once already and never actually built

Round 29's original task doc (`round29-accredited-reps-build-and-seed-task.md`) already said the quiet part out loud: *"this needs to become a recurring small task, not a one-time seed — same pattern already established for the visa-bulletin/processing-times knowledge base (CW-34), which also can't be automated reliably and gets refreshed by hand periodically."* That was written Sep 8. It never turned into an actual schedule, script, or reminder — every entity type since (legal aid orgs, and now attorneys in round 40) has been a one-time pull with no re-check built in. Every listing does carry a source + pull date (required since round 29), but that date is currently frozen at seed time — nothing re-verifies it, and nothing removes an entry once the underlying credential lapses or the organization closes.

This is a real gap, and it's exactly what `terms-get-help-directory-additions-sep9.md`'s Section 8 language leans on to manage liability — *"we do not independently verify... beyond what the source record itself states as of the date we pulled or received it"* only holds up as a genuine mitigation if pulling and re-checking is actually a recurring thing that happens, not a one-time historical fact.

## The two different data-quality problems, and why they need different fixes

**Government/official-source-backed listings** (accredited representatives + legal aid orgs, both from the DOJ EOIR roster; attorneys from FL/TX/NC board-certification lists once round 40 ships) can be *re-verified against the same source* — the source itself is the ground truth, so staying current just means re-pulling it periodically and diffing.

**Self-enrolled listings** (anyone who submits through a `/<type>/join` form, across all six types) have no external source to re-check against — the only ground truth is the listed party themselves. Staying current here means periodically asking *them* to reconfirm, not re-pulling a government file.

Both problems exist across all six entity types, present and future — attorneys and legal aid orgs already mix both (DOJ/board-certified seed data *plus* self-enrollment), and DSOs/community orgs/employers will too once built.

## Decided process

### 1. Complete automated refresh for every government-sourced list, on a confirmed cadence — no manual diff review

Full re-download of each source (DOJ EOIR roster; FL/TX/NC board-certification pages), re-parse with the existing debugged logic, and **fully replace the source-tagged rows in the DB** with the fresh pull — additions, updates, and removals of anything the source no longer shows, applied automatically, not staged as a diff for Peter to review first.

**Confirmed cadence (Sep 9):**
- **DOJ EOIR roster** (accredited representatives + legal aid orgs, same source document — one refresh run covers both) — **quarterly**.
- **State bar board-certification lists** (attorneys, FL/TX/NC) — **annually**.
- **Whatever DSOs/community orgs end up sourced from**, once built — same logic applies once a real source is chosen for those; likely quarterly or annual depending on how fast that source actually changes.

**Why this is safe without a human reviewing every diff first, given the standing "nothing auto-populates a listing without manual review" principle:** that principle still holds for *new, previously-unseen* entity types and data sources — someone still decides what source to trust in the first place (as this whole doc and `attorney-directory-self-sourcing-research-sep9.md` did for attorneys). But for a source already vetted once, re-running the *same, already-debugged* pipeline against fresh data from the *same* source isn't a new judgment call each time — it's mechanical. The safety net moves from "Peter reviews every change" to "the pipeline's own validation catches a bad run": cross-checking the parsed count against the source's own stated total, and refusing to apply a refresh at all (not just flagging it) if that count swings wildly from the last run. See round 42 (`round42-directory-refresh-pipeline-task.md`) for the actual mechanism, including the `data_source` tagging that keeps a refresh from ever touching a self-enrolled listing it has no business touching.

### 2. Never leave a source-confirmed-lapsed entry live

When a re-pull's diff shows an entry the source itself now marks lapsed, expired, or no longer listed, that entry gets removed or marked inactive as part of applying the diff — not left up because "it was fine when we seeded it." This was already the rule at initial-seed time (round 29: *"skip any entry already past its accreditation expiration date"*) — the re-pull process just applies the same rule on an ongoing basis instead of only once.

### 3. Periodic re-confirmation for self-enrolled listings, across all six types

Since there's no external source to re-check, ask the listed party directly. Simplest version: an automated email (via the existing Postmark transactional setup) roughly annually to each self-enrolled listing's contact, something like "confirm your CaseWhy Get Help listing is still accurate" with a one-click confirm link; no response after a reasonable window (e.g., 60-90 days) either flags the listing for manual review or auto-unpublishes it pending reconfirmation — your call on which is the right default. This is a real build (a new scheduled email + a confirm-link flow), not something to bundle into round 40 — worth its own round once you're ready to prioritize it.

### 4. A user-facing "report incorrect information" link on every listing, all six types — recommend building this now

This is the cheapest, highest-value piece: doesn't require picking a re-pull cadence or building an email-reconfirmation flow first, and it's the exact same shape as a pattern already built six times over (the `/<type>/join` self-enrollment → admin notification pattern). A small "See something wrong? Report it" link on every listing card and every permalink page, feeding the same kind of admin notification Peter already gets for new join submissions. It directly backs up the ToS language ("if you're relying on a listing... confirm directly... or [report it]") with an actual mechanism, not just a disclaimer. **I've drafted this as `round41-report-listing-feature-task.md` — ready to send to Claude Code if you want it.**

### 5. Keep "last verified" meaningful, not frozen

Every listing already shows source + pull date. Each automated refresh updates that date to the run that actually touched the row, not a frozen original-seed-time stamp. Worth also showing a small "may be out of date — verify independently" note on any listing whose last-verified date is somehow older than the cadence's own window would allow (a sign a scheduled refresh was skipped or failed its own safety check) — makes the disclaimer concrete on the page itself, not just in the Terms.

## Also reflected in the Terms of Service proposal

`terms-get-help-directory-additions-sep9.md`'s Section 8 language was updated Sep 9 to state this actual cadence (quarterly / annually) rather than a vague "periodically," and to note explicitly that self-enrolled listings sit outside the automatic refresh — still gated on Peter's sign-off before it goes to Claude Code, same as every other Terms change on this project.

## Status of each piece

1. **Report-a-listing feature** — done (round 41, shipped), stays as a secondary/passive signal.
2. **Refresh cadence** — decided (Sep 9): quarterly DOJ-sourced, annual board-certification.
3. **Refresh mechanism** — authorized as round 42 (source tagging + reusable idempotent refresh scripts); the cloud session is setting up the two recurring schedules to actually fire it going forward.
4. **Self-enrollment reconfirmation emails** — not part of this decision; self-enrolled listings are explicitly outside the automatic refresh (per the ToS update above) and rely on the report-a-listing link instead for now. Worth its own round later if self-enrolled volume grows enough to matter.

## Bake this into the standing template for the still-unbuilt entity types

Updating `partner-marketing-domain-concept.md`'s six-entity-type template to add "data freshness: re-pull cadence for sourced data, reconfirmation cadence for self-enrolled data, report-a-listing link" as a standard requirement alongside the state filter, disclaimer, and back-link requirements already there — so DSOs, community orgs, and employers get this from day one instead of it being retrofitted like everything else has been.
