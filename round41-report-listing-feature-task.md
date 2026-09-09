# New task for Claude Code — round 41: "report incorrect information" on every Get Help listing

**Status: authorized now.** Part of closing a real gap Peter raised (Sep 9): there's no process yet to keep the six Get Help directories current, which is a genuine liability concern given `terms-get-help-directory-additions-sep9.md`'s pending Section 8 language leans on "we don't independently verify beyond what the source stated as of pull date" as its mitigation — that only holds up if there's an actual way for inaccuracies to surface and get fixed. This is the piece of the fix that doesn't require picking a re-pull cadence first (see `get-help-directory-freshness-process-sep9.md` for the full process proposal — the recurring re-pull/diff piece and the self-enrollment reconfirmation-email piece are separate, later decisions, not part of this round).

## What to build

A small "See something wrong with this listing? Report it" link/button, on:
1. Every listing card on `/attorneys`, `/accredited-representatives`, `/legal-aid` (the three live entity types today).
2. Every permalink page (`/attorneys/[id]`, `/accredited-representatives/[slug]`, `/legal-aid/[slug-or-id]`).
3. Baked into the standard template for the still-unbuilt entity types (DSOs, community orgs, employers) so it ships with them from day one rather than as a retrofit — update `partner-marketing-domain-concept.md`'s standing template note accordingly (it already lists this as a requirement per the Sep 9 process doc; just confirm it's followed when those types eventually get built).

Clicking it opens a minimal form: which listing (pre-filled/hidden, don't make the user retype it), what's wrong (a short free-text field — "phone number is disconnected," "no longer at this address," "organization closed," etc.), and an optional email if they want a reply. No sign-in required — the person reporting a bad listing is very possibly not a signed-up CaseWhy user at all.

## Notification + review

Same pattern already established for every `/<type>/join` submission: a new report notifies Peter (however that's currently wired — check the existing join-notification code and reuse it rather than building a second notification path). **This is a report queue, not an auto-edit or auto-removal** — nothing about a report automatically changes a live listing; Peter reviews and decides, consistent with the standing "nothing auto-populates a public listing without manual review" principle already in place for new entries.

## Data model

A `listing_reports` table (or similar) — reported entity type, entity id, the report text, optional reporter email, timestamp, and a status field (new/reviewed/resolved) so there's a simple way to see what's still open. Doesn't need a full admin UI at this volume (same reasoning round 28 already used for join submissions — a notification is enough for now), but the status field means one exists cheaply if volume grows later.

## Verify live

Report link visible and working on all three live entity types' listing cards and permalink pages, a real test report submitted and confirmed landing in the database with a real notification sent, `tsc`/lint clean, production build succeeds, deployed and confirmed live. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
