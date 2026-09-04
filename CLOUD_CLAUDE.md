# CaseWhy — Project Context for Claude Code

This file is the standing handoff between the cloud Claude session (which owns business/planning work and the artifacts below) and Claude Code sessions running here on the Fedora machine (which own the codebase). Read this first; update it — and tell the user to mention updates back to the cloud session — whenever a status below changes.

## What this is

CaseWhy is an AI-explained USCIS case-status tracking web app. Existing trackers (Lawfully, US Case Tracker, VisaWatch) poll USCIS and show status. CaseWhy's differentiator: turn a status change or policy shift into a plain-language explanation and a concrete next action, instead of just a timestamp. Free tier: one tracked case. Paid tier (\~$7-15/mo): multiple cases, faster notifications, an "ask a question" AI chat (v2). Secondary revenue: attorney-referral warm handoff.

## Origin

Peter spent 2026 exploring AI-leveraged business ideas he could build and run himself (15 years as a Solution Architect, wants to use AI for dev/marketing/ ops, B2C not B2B, $500-5,000 budget). CaseWhy was selected from a B2C shortlist on Sep 2, 2026\. The idea is grounded in his own family's ordeal: N-400 naturalization applications for himself, his wife, and his daughter hit a 120+ day unexplained post-interview delay tied to a since-struck-down USCIS policy memo pausing naturalization for applicants born in \~39 "high-risk" countries — resolved only through a congressional inquiry and persistent follow-up. The product systematizes the plain-language status-tracking Peter built for his own case by hand.

Full background:

- Idea shortlist: "Ideas" Claude Project → `top-3-ai-business-ideas.md`, `top-3-b2c-app-ideas.md`  
- Full MVP scope (architecture, legal risks, monetization, go-to-market): "Ideas" Claude Project → `immigration-case-companion-mvp-scope.md` (kept current by Claude Code — this is the source of truth for product/business decisions; this file is the source of truth for build status)

## Status as of Sep 4, 2026

**Business & legal**

- Domain, DNS, SSL: done — casewhy.com live, Cloudflare registrar \+ DNS, code on GitHub, deployed via Vercel  
- Landing page \+ draft privacy policy: done, live since Sep 2-3  
- Google Workspace business email: done — casewhy.com shows Verified + Gmail activated in the Admin Console (confirmed Sep 4, 2026). info@casewhy.com is a live, working inbox.  
- Florida LLC: not yet filed  
- Open naming issue, narrower than previously noted: `casewhy.uscis@gmail.com` exists as a Google account (visible in the account chooser) but was **never actually used** on the live site — checked the deployed `index.html`/`privacy.html` directly (Sep 4, 2026): landing page uses `hello@casewhy.com`, privacy policy uses `privacy@casewhy.com`, neither contains "uscis". So the live contact links are already fine. Still avoid using `casewhy.uscis@gmail.com` anywhere official (the affidavit, etc.) per the same reasoning (undercuts the not-affiliated-with-USCIS disclaimer). Whether to consolidate `hello@`/`privacy@` to `info@casewhy.com` (the confirmed-live inbox) was raised and explicitly declined by the user for now — don't redo that ask without new information.

**USCIS API access**

- Developer account \+ sandbox Case Status API key: issued Sep 3, 2026 (evening)  
- `getCaseStatus()` wired to the real sandbox endpoint (`GET https://api-int.uscis.gov/case-status/{receiptNumber}`): done, `tsc` clean, verified end-to-end Sep 4, 2026 8:16am ET with a real 200 for sandbox receipt `EAC9999103403`  
- 5-day sandbox traffic requirement (must exercise both success and 4xx paths on 5 consecutive weekdays before requesting the affidavit): Day 1 (Fri Sep 4\) logged. Remaining: Mon Sep 7 – Thu Sep 10, 2026\.  
- Affidavit request to [developersupport@uscis.dhs.gov](mailto:developersupport@uscis.dhs.gov): not started — blocked on the 5-day log finishing  
- Live USCIS demo (Tue/Wed/Fri, first-come-first-served; covers UI usability, file upload, JSON payload handling, OAuth 2.0, error handling, case status tracking): not scheduled — needs a demo-ready product first, not just an API call  
- Production API access: pending all of the above  
- A duplicate, unused sandbox credential pair exists on the "CaseWhy App" in the dev portal (only the first pair is in `.env.local`) — investigated, no self-service revoke exists, left as-is (sandbox-only, low risk)
- FOIA Request and Status API client (`src/lib/uscis/foia.ts`): implemented and `tsc`-clean Sep 4, 2026 — `createFoiaCase()` and `getFoiaCaseStatus()`, types confirmed against the live docs (v1.2.0). **Live sandbox testing is blocked**: enabled the "FOIA Request and Status API - Sandbox" product on the CaseWhy App credential (portal confirms "Enabled"), but every call to both `POST /first-case-sbox/case` and `GET /first-case-sbox/case-status` returns `401 keymanagement.service.InvalidAPICallAsNoApiProductMatchFound`. Same credential's Case Status API access works fine (rules out a general auth/config problem). Tried: 20+ min of retries, disabling/re-enabling the product to force a rebind — neither worked. Looks like a platform-side issue on USCIS's end. Support email sent Sep 4, 2026 to developersupport@uscis.dhs.gov from info@casewhy.com, describing the error and troubleshooting done. Awaiting a response.

**Product build**

- Next.js/TS/Tailwind scaffold: running locally in this folder — `npm install` and `npm run dev` both succeed  
- Dashboard UI (`src/app/dashboard/page.tsx`): done Sep 4, 2026 — server component with a receipt-number search form (plain GET, no client JS needed), wired directly to `getCaseStatus()`. Renders status/description/history on success, a friendly message (using USCIS's own error text where available) on failure, and an empty state before any search. Verified in-browser against the live sandbox: empty state, a real approved-case result (EAC9999103403), and an invalid-receipt error all render correctly. This unblocks the live USCIS demo prerequisite (CW-09) and the demo-ready milestone (CW-15).  
- Git-linked Sep 4, 2026: pushed to `petertakla/casewhy` on a new **`nextjs-app` branch**, not `main` — `main` is still the live static landing page deployed to casewhy.com, and this Next.js app isn't ready to replace it yet. Open a PR from `nextjs-app` when it is.
- CI (`.github/workflows/ci.yml`): install → `tsc --noEmit` → `next build`, runs on push/PR to `nextjs-app`. Sandbox `USCIS_CLIENT_ID`/`USCIS_CLIENT_SECRET` are GitHub Actions secrets on the repo (not a persisted config file). First run passed clean.
- Note: `npm run lint` is currently broken repo-wide (missing `eslint.config.js` for ESLint 9) — pre-existing gap, not introduced by this work, and not yet in the CI workflow. Worth fixing before adding a lint step.

**Target:** paid-tier launch \~Nov 30, 2026 (\~12 weeks from a Sep 7, 2026 start). See the roadmap artifact below for the full week-by-week plan.

## Architecture (per the MVP scope doc)

- Frontend: Next.js, mobile-responsive, installable as a PWA (not a native app for v1)  
- Backend: small API \+ a scheduled poll/diff job against the USCIS Case Status API (same cron pattern as Peter's NVDA trading journal and his personal N-400 Google Sheets tracker)  
- Database: Postgres for accounts/case records, receipt numbers and case data encrypted at rest  
- AI layer: a Claude API call on each detected status change — raw USCIS status text \+ a curated policy/case-law knowledge base → plain-language explanation \+ general next-step guidance (never case-specific legal advice)  
- Notifications: SendGrid/Postmark for MVP email; push is a v2 addition  
- Initial case-type scope: naturalization (N-400), family-based green cards, employment-based cases — not every USCIS form type

## Legal/compliance guardrails to build with, not bolt on

- Unauthorized-practice-of-law risk: keep all AI-generated guidance general and informational, sourced from public USCIS process docs, never a conclusion about *this specific user's* case. Always route case-specific questions to "talk to an attorney." Disclaimer/ToS language still needs a lawyer's review before launch (\~$500-1,500 budgeted) — the live privacy policy is explicitly a draft pending that review.  
- Data sensitivity: encrypt receipt numbers/case data at rest, minimize retention, never share/sell.  
- Read the production-access affidavit's terms carefully during the access process — it may constrain commercial use, retention, or resale.  
- Avoid the string "uscis" in any business-controlled identifier (see the email issue above).

## Key files in this repo

- `README.md` — scaffold notes and the researched USCIS onboarding-process requirements (register → sandbox 5-day traffic → affidavit → live demo → production access)  
- `src/lib/uscis/client.ts` — OAuth 2.0 client-credentials flow \+ `getCaseStatus()`, wired to the sandbox  
- `src/lib/uscis/foia.ts` — FOIA Request and Status API client (`createFoiaCase()`, `getFoiaCaseStatus()`); implemented but live sandbox testing blocked, see above  
- `src/app/dashboard/page.tsx` — dashboard, wired to `getCaseStatus()` (done Sep 4)  
- `src/app/page.tsx` — landing page (email capture, no backend wired)  
- `src/lib/config.ts` — env var loading/validation  
- `.env.local` — sandbox credentials (gitignored)

## The fuller record

- **CaseWhy Launch Checklist** (live, 16 items across 4 workstreams, check items off as they complete — synced via a shared database, this is the running source of truth for open items): [https://claude.ai/code/artifact/c67d70aa-7b95-470d-9001-fe1182ffcc18](https://claude.ai/code/artifact/c67d70aa-7b95-470d-9001-fe1182ffcc18)  
- **CaseWhy Launch Roadmap** (Gantt, 4 workstreams, 18 tasks, 4 milestones, Sep 7 – Nov 30 2026): [https://claude.ai/code/artifact/0ad0e4c6-97d6-467c-ac9f-9ef3103d973c](https://claude.ai/code/artifact/0ad0e4c6-97d6-467c-ac9f-9ef3103d973c)  
- **USCIS Torch API onboarding execution spec**: [https://claude.ai/code/artifact/8981ad84-0fb3-47a8-bc68-2f484d0db7bb](https://claude.ai/code/artifact/8981ad84-0fb3-47a8-bc68-2f484d0db7bb)  
- **Ideas Claude Project** (claude.ai): `top-3-ai-business-ideas.md`, `top-3-b2c-app-ideas.md`, `immigration-case-companion-mvp-scope.md`

## Immediate next actions (roughly in order)

1. Log sandbox traffic Mon Sep 7 – Thu Sep 10 (days 2-5 of the 5-day requirement)  
2. ~~Resolve Google Workspace domain verification~~ — confirmed done Sep 4, 2026 (Verified + Gmail activated)  
3. ~~Rename the business contact email to drop "uscis"~~ — turned out unnecessary; the live pages never used the "uscis" placeholder (see note above)  
4. File the Florida LLC  
5. ~~Build the dashboard UI against `getCaseStatus()`~~ — done Sep 4, 2026  
6. ~~`git init`/link this working copy to the existing GitHub repo; set up CI with sandbox creds as Actions secrets~~ — done Sep 4, 2026 (pushed to `nextjs-app` branch, CI passing)  
7. Once the 5-day log is complete, email [developersupport@uscis.dhs.gov](mailto:developersupport@uscis.dhs.gov) to request the affidavit
8. ~~Send the drafted FOIA product-binding support email~~ — done Sep 4, 2026; awaiting USCIS response

