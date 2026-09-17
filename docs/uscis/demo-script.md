# CaseWhy — USCIS Torch Demo Script (target: 20 minutes inside the 30-minute Teams slot)

Real format, confirmed against `developer.uscis.gov`: a 30-minute Microsoft Teams call, Wednesday or Thursday 1:00–2:00 PM ET, recorded, audio required. Peter attends alone — USCIS explicitly allows the primary business contact and the technical demo lead to be the same person. Results arrive by email within 2 business days; a fail routes to a 15-minute "Re-Demo Office Hours" on just the missed criteria.

Shows USCIS's five real Case Status API criteria, in order: (1) data entry usability, (2) JSON payload conversion, (3) OAuth 2.0, (4) HTTPS response handling — success and error, message shown in the UI, (5) case status tracking. **File upload is a FOIA API criterion, not Case Status — deliberately not in this script.**

---

## Before the call

1. **Confirm the `demo_id` step is already done and accepted by USCIS.** USCIS won't send the scheduler link until they've seen proof `demo_id` is wired in — that has to happen before this call can even be booked. See "demo_id setup," below.
2. **Set up a dedicated demo account with no real PII** — a fresh sign-up, then upgrade it to Plus via `/plus` → Stripe Checkout using a Stripe test card (`4242 4242 4242 4242`, any future expiry/CVC) — billing is in test mode, so this is a real checkout with no real charge. Plus is needed so the on-demand check / request-preview / error-detail features are all available live. Track cases only under confirmed sandbox test receipt numbers (table at the bottom of this script). Do not use Peter's own real account or any account with a genuine tracked case.
3. Have `docs/uscis/technical-brief.md` (PDF) and `docs/uscis/demo-qa.md` open or printed.
4. Keep a second window open with a Cloud session signed in — if a question stumps you, type it in a few words; an answer comes back in under a minute, and you read it back.
5. Confirm the sandbox is up before the call: it operates 7 AM–8 PM ET only. This call is scheduled 1–2 PM ET, inside that window, but re-check the same morning.
6. **Rehearse the whole script once against the sandbox, with Code watching the logs, before the demo_id screenshot is even sent.** Not done as of this document being written — do this first.
7. **Check `app.casewhy.com` loads normally right before the call** (`curl -I https://app.casewhy.com`, or just open it). Vercel's automatic bot/DDoS mitigation has tripped on this domain before from a burst of rapid API calls — exactly what rehearsing this script, or the call itself, looks like. If the site 403s with a "Security Checkpoint" page, run `vercel firewall system-mitigations pause` from a real terminal inside the `casewhy` project directory (it needs an interactive confirmation, so a Cloud session can't run it for you) and re-check.

## `demo_id` setup (must happen before the call can be scheduled)

1. USCIS assigns a 4-digit ID. Set it as `USCIS_DEMO_ID` in Vercel's production environment (`vercel env add USCIS_DEMO_ID`).
2. **Redeploy production** (`vercel --prod`) — a new/changed environment variable isn't picked up by already-running functions until the next deploy.
3. Confirm it's live: use the on-demand check button on any tracked case (Step 2 below) and open "Show technical details" — the `demo_id` header should appear in the redacted request preview. That screenshot *is* the proof USCIS wants.
4. Email that screenshot to Torch Developer Support. The scheduler link comes back after they see it.
5. **Remove `USCIS_DEMO_ID` from Vercel and redeploy again after the real demo is done** — it should only be set during the actual demo window, not permanently.

---

## Script

### Step 1 — Sign in, show the interface (2 min)

**Click:** Navigate to `app.casewhy.com`, sign in to the dedicated demo account (or show the sign-in flow live).
**Say:** "This is CaseWhy, a case-status tracker. I'll walk through all five criteria: data entry, the JSON payload, OAuth 2.0, error handling, and case tracking."
**Reviewer sees:** the dashboard; the receipt-number field's live format feedback (type a few characters, show the red/green indicator); the Spanish toggle; resize the window briefly to show mobile responsiveness.
**Criterion:** #1, data entry usability.
**If it fails live:** if sign-in hangs, refresh once (a known-clean path from rehearsal). If the sandbox itself is down: "Here's a recording of this exact flow from rehearsal," and switch to it.

### Step 2 — Look up and track a case, show the JSON payload (4 min)

**Click:** Enter `WAC9999999999` (I-751, confirmed sandbox test number) in the receipt field → click "Look up status." The result card appears with a "Track this case" button right under the status line. Click it (case type defaults to "Other," one click saves). Then click "Check now," then "Show technical details."
**Say:** "Looking up a case is a real live call, but it doesn't save anything by itself — that's this separate 'Track this case' button, right here where you can't miss it. Every check converts to a real request — here's the exact JSON we send: method, URL, and headers, with the token redacted. This is generated by the same function that actually makes the call, not a separate description."
**Reviewer sees:** the new case appear in the always-visible tracked-cases list on the left; the outbound request panel (method, URL, headers, including the `demo_id` header from the setup step above).
**Criterion:** #1 (a real look-up-vs-save distinction, not a confusing overload) and #2, JSON payload conversion.
**If it fails live:** if `WAC9999999999` doesn't return a result (sandbox data can shift), use `WAC0000000001` as backup — both are on CaseWhy's own confirmed-working list.

### Step 3 — OAuth 2.0 (2 min)

**Say, over the same screen:** "Authentication is OAuth 2.0 Client Credentials — token fetched and cached server-side, refreshed automatically before expiry, and it never reaches the browser. I can show the client code directly if useful." (Have `src/lib/uscis/client.ts` open in a second tab, ready to share if asked.)
**Reviewer sees:** the code, if requested; otherwise this is narrated over Step 2's result.
**Criterion:** #3, OAuth 2.0.
**If it fails live:** no live dependency — this step can't meaningfully fail.

### Step 4 — Error handling, success and failure, both visible (4 min)

**Click:** Track a malformed number first: type `AB12345` in the field (do not submit — just show the client-side feedback), then correct it. Then, in a **separate** case-add attempt, use `EAC0000099999` (well-formed, not a real case) and let it actually submit and fail.
**Say:** "USCIS's own API returns a real 422 for a malformed number and a 404 for one it doesn't recognize — both show up as USCIS's actual message here, not a generic error."
**Reviewer sees:** the client-side red/green format feedback for the malformed number; then a real, specific USCIS error message on-screen for the unknown one.
**Criterion:** #4, HTTPS response handling (both success — Step 2 — and error, this step).
**If it fails live:** if `EAC0000099999` unexpectedly returns a real hit (a sandbox pool quirk), say so honestly and try a different well-formed-but-unlikely number rather than force it.

### Step 5 — Case status tracking end to end (4 min)

**Click:** Point at the tracked-cases list itself — every case shown with its receipt, type, last known status, and last-checked time, straight from the database. Click the pre-tracked case (`EAC9999103403`, I-130, "Case Was Approved") to open its full detail — status text and history. If it has more than one history entry, open the history view. Then, back in the list, click "Stop tracking" on the case added in Step 2, then "Yes" to confirm.
**Say:** "The list itself is always populated from our database, not just a live call — even if a refresh fails, you still see every tracked case with its last known status, not a blank page. This case is checked on a schedule; a genuine status change triggers an email and, if enabled, a push notification — never on the very first check. Removing a case is self-serve and immediate, with a confirm step."
**Reviewer sees:** the always-visible list; the status/history display; the case disappearing from the list immediately after confirming removal.
**Criterion:** #5, case status tracking.
**If it fails live:** if the pre-tracked case shows only one history entry, describe the notification mechanism directly rather than forcing an empty view to look busy.

### Step 6 — Close (2 min)

**Say:** "Everything I've shown is in the technical brief we sent ahead of this call, with the exact file and function for every claim. Happy to go deeper on anything, live or in a follow-up."

---

## Sandbox test numbers used in this script

| Receipt number | Form | Status | Used for |
|---|---|---|---|
| `EAC9999103403` | I-130 | Case Was Approved | Pre-tracked, Step 5 |
| `WAC9999999999` | I-751 | Case Was Received At My Local Office | Added live, Step 2 |
| `WAC0000000001` | I-751 | Case Was Transferred | Backup for Step 2 |
| `EAC0000099999` | — | Deliberately unknown (real 404) | Step 4 |
| `AB12345` | — | Deliberately malformed (real 422, client-side feedback only) | Step 4 |

All five are from CaseWhy's own confirmed-working sandbox pool — no real PII, no real cases, on the whole call.

## Real-time fallback rule, for anything not covered above

If something fails live that isn't covered by a specific fallback: say so plainly ("that's not behaving as expected right now — I'll confirm and follow up"), don't improvise an unverified claim, and move on. Honest and brief beats a guess in front of a federal reviewer.
