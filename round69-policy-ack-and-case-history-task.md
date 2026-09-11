# New task for Claude Code — round 69: policy-change acknowledgment gate + case status-history logging

**Status: authorized now, Sep 11.** This combines two decisions Peter made the same day, deliberately bundled since both touch the same area of the schema:

1. **Close the real remaining gap in the USCIS affidavit's privacy/ToS checklist** — build the actual active-acknowledgment mechanism (not the lighter "just send an email" fallback that was also on the table). Peter's call: "build it but with the ack piece as well since it will be required before going live."
2. **While touching this area, also start logging real case status history** — not a forecasting feature yet, just the data-capture groundwork for CW-33(b) ("Lawfully-style comparative analytics"), which stays deferred as a *feature* until there's real volume, per its own original deferral reasoning (unchanged).

Do these as two clearly separate schema changes in the same round, not one blended migration — they serve different purposes and shouldn't get tangled if one needs to change later.

## Part 1 — Policy-change active-acknowledgment gate

**The gap, precisely:** USCIS's Developer Portal Affidavit checklist (see `uscis-developer-portal-affidavit-form-filled-draft.pdf` at the repo root, and the compliance review under "USCIS API access" / item 93 in `CLOUD_CLAUDE.md`) lists "notify on change" and "active consent + plain-language summary of what changed" as two separate requirements. `privacy.html` Section 10 currently only promises an email on material changes — that satisfies "notify," not "active consent." The affidavit's own certification checkbox allows "will be appropriately updated before we schedule our demo," which is why this wasn't blocking today's signing — but it's real work still owed before the live demo, not indefinitely deferred.

**Build:**
- A `policy_acknowledgments` table (or similar): `user_id`, `policy_type` (`tos` | `privacy`), `version` (or effective date — match whatever versioning scheme is simplest given `terms.html`/`privacy.html` don't currently have a machine-readable version field; adding one is in scope if needed), `acknowledged_at`.
- A version/date constant per policy (`terms.html`, `privacy.html`) that gets bumped whenever either page has a material change — reuse the existing "Last updated" convention rather than inventing a new one.
- A gate at sign-in (or next page load post-sign-in) that checks whether the signed-in user's most recent acknowledgment for each policy is behind the current version. If so, show a blocking screen/modal with a plain-language summary of what changed (not the full diff — a short human-readable bullet list, matching the same "plain-language summary" wording USCIS's checklist asks for) and a real "I acknowledge" action the user must take before continuing. Log it to `policy_acknowledgments` on click.
- Keep the existing email-on-material-change behavior (Section 10's current promise) — this is additive, not a replacement. The email notifies; the gate gets active consent. USCIS's checklist wants both.
- Signed-out visitors aren't affected — this only applies to accounts that have actually signed in and would otherwise have acted on a stale policy version.

**Update `privacy.html` Section 10 ("Changes to This Policy")** to describe the real mechanism once built: material changes are emailed *and* require active acknowledgment at next sign-in before the account can continue using the Service. This closes the checklist item for real rather than leaving it as a stated intention.

## Part 2 — Case status-history logging (infrastructure only, no analytics/prediction feature)

**Why:** CW-33(b) ("Lawfully-style comparative analytics... needs a large base of aggregated historical case data CaseWhy doesn't have yet," per `immigration-case-companion-mvp-scope.md`) was correctly deferred and stays deferred as a *feature* — that reasoning hasn't changed, CaseWhy still doesn't have meaningful volume. What changes today is starting to capture the raw history now, so the feature isn't blocked later on "we never logged it."

**Build:**
- A new append-only table (e.g. `case_status_history`): one row per detected status *change* for a tracked case (the existing cron already detects changes via `lastStatusText` diffing in `check-status/route.ts` — hook into that same detection point rather than duplicating it). Fields: a reference to the tracked case, case type, the status text/category, a timestamp, the receipt-number prefix (service-center proxy — don't store the full receipt number a second time in plaintext; derive just the prefix at write time), and any milestone dates CW-39 already surfaces (interview/oath-ceremony-scheduled) if present on that check.
- This is purely additive logging alongside the existing overwrite-latest-status behavior in `tracked_cases` — don't change or remove what's there now.
- **Explicitly out of scope for this round:** any analytics UI, comparative benchmarking, or prediction/forecasting feature. This round only makes the data exist going forward. Re-evaluate building the actual feature once real tracked-case volume is large enough to mean anything — same bar CW-33(b) already set, not a new one.
- Keep it de-identifiable in mind from the start: design the table so a future aggregate query (e.g. "median days from filing to approval for I-130 at the Vermont Service Center") doesn't require joining back to a specific user's identity. Doesn't need to be enforced today, just don't design it in a way that makes that harder later.

**Update `privacy.html`'s "How We Use Your Information" section** with one new line disclosing this: de-identified or aggregated case status history may be used to build processing-time statistics or estimates in the future. This is a new data use, not covered by existing language — it needs its own disclosure now, not as a follow-up, since shipping it silently would open a new compliance gap the same week others are being closed.

## Verify live

- A real account with a stale acknowledgment sees the gate on next sign-in, can't dismiss it without acknowledging, and the acknowledgment is logged with a real timestamp; a fully-acknowledged account sees no gate.
- The existing material-change email still fires (regression check — don't break Section 10's existing promise while adding the gate).
- A real detected status change writes a `case_status_history` row through the actual cron code path (not a mock), with no change to `tracked_cases`'s existing overwrite behavior.
- Both `privacy.html` additions are live, verified via a real fetch, not just the commit diff.

## Out of scope

No forecasting, prediction, or comparative-analytics UI this round. No change to the affidavit already filled/pending signature. No change to the ack table's design for non-tracked-case marketing pages (signed-out visitors).
