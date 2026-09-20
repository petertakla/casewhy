# CaseWhy — Pre-Answered Q&A for the USCIS Torch Demo

Every answer below is drawn from `docs/uscis/technical-brief.md` (which has the file/function citations) and was verified against the live application, not recalled from memory. Format: plain-language answer first, then the technical specifics, then where it's shown live in the demo.

USCIS evaluates five pass/fail criteria for the Case Status API demo (confirmed directly against `developer.uscis.gov`, not assumed): data entry usability, JSON payload conversion, OAuth 2.0 authentication, HTTPS response handling (success and error, message shown in the UI), and case status tracking. File upload is a separate FOIA API criterion and is not part of this demo.

---

## About the demo itself

**What's the format?**
A 30-minute Microsoft Teams call, recorded, audio required. Peter (founder, sole operator, and the affidavit's signatory) attends alone — USCIS explicitly allows the same person to be both the primary business contact and the technical demo lead.

**What's the demo_id, and why does it matter before the call is even scheduled?**
USCIS assigns a 4-digit ID that must be sent as a `demo_id` header on every Case Status API request during the demo window — the scheduler link isn't issued until we send proof (a screenshot or code snippet) that it's wired in. `src/lib/uscis/client.ts`'s `demoIdHeader()` sends it automatically on every call whenever `USCIS_DEMO_ID` is set, and sends nothing extra when it isn't — so it's genuinely off outside the demo window, not just unused.

**What happens after the call?**
Results by email within 2 business days. A fail routes to a 15-minute "Re-Demo Office Hours" covering only the missed criteria — not a full re-demo from scratch.

---

## Architecture and hosting

**What is CaseWhy, and who built and operates it?**
CaseWhy is a free web app that tracks a USCIS case by receipt number and explains its status in plain language. It's built and operated by one person — Peter, founder of CaseWhy LLC, a Florida company. Development is AI-assisted (Claude Code). *Shown in demo: introduction.*

**What's the stack, and where does the API call actually happen?**
Next.js on Vercel, Postgres on Neon, Postmark for email, Stripe for billing. Every call to USCIS's API happens entirely server-side — the browser never sees a credential or a token. Technically: `src/lib/uscis/client.ts` runs only on Vercel's Node.js runtime (never the browser, never an Edge function), so USCIS credentials never leave our server. *Shown in demo: step 2 (a live status check, watched in server logs).*

**Is there a mobile app?**
No native app — CaseWhy is installable as a Progressive Web App (add to home screen, works offline for cached content), same codebase as the website.

---

## OAuth 2.0

**Which grant type do you use, and how are tokens handled?**
Client Credentials, exactly as USCIS documents it. We cache the access token in memory and refresh it automatically about 30 seconds before it expires, rather than fetching a new one on every call — so we're not hammering the token endpoint. Sandbox and production use entirely separate credential pairs, selected by one environment setting; there's no code path where they could get mixed up. *Shown in demo: step 2, watching the token fetch/cache behavior in logs.*

**What happens on a 401 or an expired token mid-request?**
The next call simply re-authenticates — our cache check runs on every call, so an expired token is caught and refreshed automatically, not retried in a loop.

**Where are the client ID and secret stored?**
As encrypted environment variables in Vercel, never in our source code or version control — `.gitignore` excludes every environment file, and there are zero hardcoded secrets anywhere in the codebase.

---

## JSON payload handling

**Which fields do you actually use, and how do you handle the response?**
Form type, current status text and description, submitted/modified dates, and the full status history array. We parse the response against a defined shape that accounts for USCIS's documented variations (like the IOE-prefix response sometimes omitting dates) rather than assuming every field is always present. *Shown in demo: step 3, a tracked case's status/history display.*

**Do you show USCIS's status text as-is, or rewrite it?**
We show it exactly as USCIS returns it, and separately — visually distinguished — our own plain-language explanation of what it means. We never present a rewritten version of USCIS's own words as if USCIS said them.

**Do you store the raw API response?**
We store the fields we use (status text, history entries, dates) — not an opaque full-payload blob. The receipt number itself is stored encrypted, separately from status data, and is never included in what we send to our AI explanation service (more in the privacy section below).

**Can you actually show the JSON payload being sent, not just describe it?**
Yes — the on-demand check button has a "Show technical details" toggle that renders the exact outbound request (method, URL, headers, with the token redacted) our code sends for that click. It's generated by the same function `getCaseStatus()` itself uses, not a second hand-written description that could drift out of sync. *Shown in demo: step 3.*

---

## Error handling

**What happens with an invalid or unknown receipt number?**
The format (3 letters + 10 digits) gets real-time client-side feedback as you type — a visual hint, not a hard block, since a well-formed number still might not be real. We confirmed the real API responses directly against your sandbox: a malformed number returns a real `422` with a message explaining the format requirement, and a well-formed but unknown number returns a real `404` with a message saying the case isn't recognized. Both get surfaced to the user as a clear, USCIS-worded error message. *Shown in demo: step 4, deliberately entering a malformed number and an unknown one.*

**Does the error message actually reach the screen, or just the logs?**
It reaches the screen — the on-demand check button shows USCIS's actual message directly, not a generic substitute.

**What about rate-limit (429), server-error (5xx), or timeout responses?**
Every one of those goes through the exact same error-display path as the 422/404 above — there's no special-casing that could silently diverge. We've directly observed a real 429 once during sandbox testing (see the rate-limiting section) and it was handled cleanly; 5xx and auth-failure responses haven't occurred live but would route through the identical code. A 15-second client-side timeout was added specifically so a hung request can't wait forever. *See the response-code table in technical-brief.md, Section 4.*

**Do you retry on failure?**
No automatic retries in the API client — a failed call is reported as an error for that specific check, so we're not compounding load on USCIS's API with a retry storm. The next scheduled check will naturally try again.

**Do receipt numbers ever end up in logs?**
No — our status-check job only holds a decrypted receipt number in memory for the duration of the actual API call; error logs reference the internal case record, not the receipt number in plaintext.

---

## Rate limiting and volume

**What's your current and projected call volume, and is there a real limit, not just a documented plan?**
Today: a small number of daily calls, one per actively tracked case, on a fixed schedule — volume scales with how many cases our users track, not with site traffic. There's a real, enforced hard cap in the client itself, not just documented pacing: no more than 1,000 calls per day and no more than 4 per second, checked before every call and refused (with a logged alert) if either would be exceeded. Those thresholds match the sandbox's own confirmed limits; we'll raise them once USCIS shares the real production quota. *See "Rate limiting and volume" in technical-brief.md.*

**Have you actually load-tested against the sandbox?**
Yes — a real 5-business-day sandbox volume test, September 14–18, 2026, using our actual production code path, not a mock. ~900 calls/day, under the sandbox's published 1,000/day, 5-TPS ceiling. One real `429` occurred once, Tuesday, one call out of 50 in a single batch — the next scheduled batch completed cleanly, and it hasn't repeated. We're telling you that rather than claiming a suspiciously perfect record. *See "Sandbox testing" in technical-brief.md for current day-by-day numbers.*

**Do you cache results, or hit the API on every page load?**
Results are cached in our own database between scheduled checks — a user viewing their dashboard isn't triggering a new USCIS API call; they're seeing the last fetched result.

---

## Case status tracking

**How does a user add a case, and how many can they track?**
Sign in, enter a receipt number, done. Free accounts: up to 3 cases. Paid accounts: more, in tiers, with a hard ceiling above which we talk to the user directly rather than self-serve. *Shown in demo: step 1 (adding a new case live).*

**How do you detect a status change, and how does the user find out?**
Our scheduled job compares the freshly fetched status text against the last one we saw for that case. On a genuine change (never on the very first check), we send an email via Postmark and, if the user's enabled it, a push notification. *Shown in demo: step 3.*

**What happens when a user removes a case?**
Immediate and self-serve — one click on the dashboard deletes that case's record, including its encrypted receipt number, from our database right away. *Shown in demo: step 5.*

---

## File upload (not part of this demo — FOIA API criterion, mentioned for completeness only)

**Is the document upload feature real, or a placeholder?**
It's real — paid-tier users can upload PDFs, JPEGs, or PNGs up to 10MB, stored privately (never a public URL). The original filename is encrypted before storage, since a filename can itself be identifying. No uploaded document is ever sent to USCIS or any other third party — it's purely for the user's own reference. We're not planning to show this live, since it's evaluated under the FOIA API's criteria, not Case Status — happy to describe or demo it separately if asked.

---

## UI usability

**Is the app accessible?**
We use semantic HTML and ARIA labeling throughout the interface, and it's fully usable via keyboard. Honestly: we don't yet run automated accessibility testing (like axe or Lighthouse CI) as part of our build process — that's a real, acknowledged gap, not something we're claiming full formal compliance on.

**What languages does it support?**
English and Spanish, with a switcher available on every public and signed-in page.

**How fast can a new user get from landing to a tracked case?**
Under two minutes — no account required to browse reference material (processing times, Visa Bulletin, the Get Help directories); signing up and adding a first case is a short, linear flow. *Shown in demo: the full flow, start to finish.*

---

## Privacy, security, and data handling

**How is a receipt number protected?**
Encrypted with AES-256-GCM before it's ever written to our database — an authenticated encryption mode, so tampering is detected, not silently accepted. The encryption key lives only as a protected environment variable, separate from the database itself. No CaseWhy staff member can view a receipt number in plaintext through any administrative tool, ever.

**What exactly gets sent to your AI provider?**
Form type, processing center, dates, status text, history, and general policy background — never the raw receipt number. That's not a policy promise; it's how the prompt-building code is actually written. The one exception: our paid-tier letter-drafting tool includes the receipt number in the letter itself, since the letter has to name the case to USCIS or a congressional office — sent to the same AI provider solely to help draft that letter.

**What happens if a user wants their data deleted?**
Removing an individual case is immediate and self-serve. Full account deletion is a request — email `privacy@casewhy.com` and it's completed within 30 days.

**Who else receives any case data?**
USCIS itself (to retrieve status), Anthropic (status text, dates, and history for AI explanations, plus the receipt number specifically for the letter-drafting exception above), Postmark (the notification email address and status text, to send emails), Vercel and Neon (infrastructure — hosting and database, no independent access to decrypted data outside our own code), Stripe (billing information only, never case data), and — for a paid-tier congressional-representative lookup only — the U.S. Census Bureau's public geocoding API. No advertising, no data brokers, no sale of personal information, ever.

**What's your security posture, honestly?**
HTTPS/TLS everywhere, security headers (HSTS, a Content-Security-Policy, and the standard set) on every response, encryption at rest for sensitive fields, a single fail-closed admin allowlist, and no hardcoded secrets anywhere in the codebase. Automated dependency monitoring runs via Dependabot, with `npm audit` also visible in CI. One honest, tracked-not-hidden gap: two pre-existing findings in transitive dev-tooling dependencies (not runtime application code) are open pending a deliberate major-version upgrade we didn't want to force through days before this demo.

---

## Business and operations

**How does CaseWhy make money, and is anything from the USCIS API paywalled?**
A free tier and an optional paid tier ($9.99/month, or discounted 6-month/annual). Nothing from the Case Status API is ever paywalled — status checking is free at every tier. The paid tier adds more tracked cases, unlimited AI questions, on-demand checks, document storage, and drafting tools.

**Is billing live, or still in test mode?**
Test mode — we haven't processed a real production payment yet. That's a deliberate, honest state, not something we're overstating; flipping to live payments is a distinct step we haven't taken.

**What's your support setup?**
13 real, monitored email addresses on our domain, including dedicated ones for security, privacy, legal, and abuse reports — each is actively polled, with the most sensitive ones escalated immediately.

**What happens if production access were ever revoked?**
We'd show users an honest degraded-service message. We have no scraping fallback and won't build one — if the API isn't available to us, the feature isn't available, full stop.
