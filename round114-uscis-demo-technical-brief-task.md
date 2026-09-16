# Round 114 — USCIS Torch demo: technical brief, pre-answered Q&A, demo script

Status: authorized Sep 16, 2026. Superseded mid-round by a cloud-verified correction against USCIS's own real demo-criteria pages — see below.

## USCIS's real criteria (verified against developer.uscis.gov)

30-minute Teams call, Wed/Thu 1–2pm ET, recorded; Peter may attend alone. Five pass/fail criteria for the Case Status API: data entry usability, JSON payload conversion, OAuth 2.0, HTTPS response handling (success and error, message shown in UI), case status tracking. File upload is a FOIA API criterion, not Case Status — excluded from this demo. A `demo_id` header (USCIS-assigned) must be proven wired in via screenshot before the scheduler link is sent.

## Deliverables

`docs/uscis/technical-brief.md` (+ PDF), `docs/uscis/demo-qa.md`, `docs/uscis/demo-script.md`. Every claim checked against the live code or a real live sandbox call.

## Claude Code build notes (Sep 16, 2026) — DONE

Built a self-assessment table against the real 5 criteria (Section 0 of the brief). Two real gaps found and fixed while verifying facts, not written around:

1. `checkCaseNow()` was swallowing USCIS's real error message behind a generic string — fixed via new `extractUscisErrorMessage()`, confirmed against a real 422 (malformed) and 404 (unknown) sandbox response. Both are a flat `{"message": "..."}` shape, not the RFC 9457 array shape the original task doc assumed — corrected via a live probe before building parsing logic.
2. No way existed to show the real outbound JSON payload — new `describeCaseStatusRequest()` mirrors `getCaseStatus()`'s real request, surfaced via a new "Show technical details" toggle on the dashboard's on-demand check button. Real, permanent feature, not demo-only.

New `USCIS_DEMO_ID` env var + `demoIdHeader()`, scoped to Case Status only, confirmed both branches (set/unset) locally.

A third, unrelated real bug found while verifying retention claims: the live Privacy Policy and FAQ (EN/ES) both falsely claimed self-serve account deletion "from account settings" — no such control exists. Fixed to describe the real mechanism (per-case removal is self-serve; full deletion is an email request).

## Verify

- `grep -in "TBD|verify" docs/uscis/*.md` returns nothing.
- `tsc`/lint/build clean; deployed to production.
- Real sandbox calls confirm both new client.ts functions behave correctly.
- Privacy.html/FAQ fix confirmed live via curl.

## Still Peter's own step, correctly not done by Code

The actual rehearsal run (needs Code watching logs live), a dedicated no-PII demo account, sending the demo_id screenshot to Torch, booking the real call.
