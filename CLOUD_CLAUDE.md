# CaseWhy — Project Context for Claude Code

This file is the standing handoff between the cloud Claude session (which owns business/planning work and the artifacts below) and Claude Code sessions running here on the Fedora machine (which own the codebase). Read this first; update it — and tell the user to mention updates back to the cloud session — whenever a status below changes.

## What this is

CaseWhy is an AI-explained USCIS case-status tracking web app. Existing trackers (Lawfully, US Case Tracker, VisaWatch) poll USCIS and show status. CaseWhy's differentiator: turn a status change or policy shift into a plain-language explanation and a concrete next action, instead of just a timestamp. Free tier: one tracked case. Paid tier (~$7-15/mo): multiple cases, faster notifications, an "ask a question" AI chat (v2). Secondary revenue: attorney-referral warm handoff.

## Origin

Peter spent 2026 exploring AI-leveraged business ideas he could build and run himself (15 years as a Solution Architect, wants to use AI for dev/marketing/ ops, B2C not B2B, $500-5,000 budget). CaseWhy was selected from a B2C shortlist on Sep 2, 2026. The idea is grounded in his own family's ordeal: N-400 naturalization applications for himself, his wife, and his daughter hit a 120+ day unexplained post-interview delay tied to a since-struck-down USCIS policy memo pausing naturalization for applicants born in ~39 "high-risk" countries — resolved only through a congressional inquiry and persistent follow-up. The product systematizes the plain-language status-tracking Peter built for his own case by hand.

Full background:

- Idea shortlist: "Ideas" Claude Project → `top-3-ai-business-ideas.md`, `top-3-b2c-app-ideas.md`
- Full MVP scope (architecture, legal risks, monetization, go-to-market): "Ideas" Claude Project → `immigration-case-companion-mvp-scope.md` (kept current by Claude Code — this is the source of truth for product/business decisions; this file is the source of truth for build status)

## Status as of Sep 4, 2026

**Business & legal**

- Domain, DNS, SSL: done — casewhy.com live, Cloudflare registrar + DNS, code on GitHub, deployed via Vercel
- Landing page + draft privacy policy: done, live since Sep 2-3
- Google Workspace business email: done — casewhy.com shows Verified + Gmail activated in the Admin Console (confirmed Sep 4, 2026). info@casewhy.com is the sole licensed user and primary inbox. `hello@casewhy.com` and `privacy@casewhy.com` are configured as email aliases on it (not separate licensed accounts), with Gmail filters auto-labeling incoming mail by "To" address ("Hello" / "Privacy" labels) so privacy-alias mail (data-subject/deletion requests) stays visibly distinct from general inquiries.
- Florida LLC: not yet filed
- Open naming issue, narrower than previously noted: `casewhy.uscis@gmail.com` exists as a Google account (visible in the account chooser) but was **never actually used** on the live site — checked the deployed `index.html`/`privacy.html` directly (Sep 4, 2026): landing page uses `hello@casewhy.com`, privacy policy uses `privacy@casewhy.com`, neither contains "uscis". So the live contact links are already fine. Still avoid using `casewhy.uscis@gmail.com` anywhere official (the affidavit, etc.) per the same reasoning (undercuts the not-affiliated-with-USCIS disclaimer). Whether to consolidate `hello@`/`privacy@` further was raised and the decision was to keep all three addresses distinct (general/privacy/institutional) rather than merge — don't redo that ask without new information.

**USCIS API access**

- Developer account + sandbox Case Status API key: issued Sep 3, 2026 (evening)
- `getCaseStatus()` wired to the real sandbox endpoint (`GET https://api-int.uscis.gov/case-status/{receiptNumber}`): done, `tsc` clean, verified end-to-end Sep 4, 2026 8:16am ET with a real 200 for sandbox receipt `EAC9999103403`
- 5-day sandbox traffic requirement (must exercise both success and 4xx paths on 5 consecutive weekdays before requesting the affidavit): Day 1 (Fri Sep 4) logged. Remaining: Mon Sep 7 – Thu Sep 10, 2026.
- Affidavit request to developersupport@uscis.dhs.gov: not started — blocked on the 5-day log finishing
- Live USCIS demo (Tue/Wed/Fri, first-come-first-served; covers UI usability, file upload, JSON payload handling, OAuth 2.0, error handling, case status tracking): not scheduled — needs a demo-ready product first, not just an API call
- Production API access: pending all of the above
- A duplicate, unused sandbox credential pair exists on the "CaseWhy App" in the dev portal (only the first pair is in `.env.local`) — investigated, no self-service revoke exists, left as-is (sandbox-only, low risk)
- FOIA Request and Status API client (`src/lib/uscis/foia.ts`): implemented and `tsc`-clean Sep 4, 2026 — `createFoiaCase()` and `getFoiaCaseStatus()`, types confirmed against the live docs (v1.2.0). **Live sandbox testing is blocked**: both `POST /first-case-sbox/case` and `GET /first-case-sbox/case-status` return `401 keymanagement.service.InvalidAPICallAsNoApiProductMatchFound` despite the sandbox product showing "Enabled." Case Status API on the same credential works fine, so this looks platform-side. Support email sent Sep 4, 2026 to developersupport@uscis.dhs.gov from info@casewhy.com. Awaiting a response — no action to take here until USCIS replies.

**Product build**

- Next.js/TS/Tailwind scaffold: running locally in this folder — `npm install` and `npm run dev` both succeed
- Dashboard UI (`src/app/dashboard/page.tsx`): done Sep 4, 2026 — server component with a receipt-number search form (plain GET, no client JS needed), wired directly to `getCaseStatus()`. Renders status/description/history on success, a friendly message on failure, and an empty state before any search. Verified in-browser against the live sandbox. This unblocks the live USCIS demo prerequisite (CW-09) and the demo-ready milestone (CW-15).
- Git-linked Sep 4, 2026: pushed to `petertakla/casewhy` on a new **`nextjs-app` branch**, not `main` — `main` is still the live static landing page deployed to casewhy.com, and this Next.js app isn't ready to replace it yet. Open a PR from `nextjs-app` when it is.
- CI (`.github/workflows/ci.yml`): install → `tsc --noEmit` → `next build`, runs on push/PR to `nextjs-app`. Sandbox `USCIS_CLIENT_ID`/`USCIS_CLIENT_SECRET` are GitHub Actions secrets on the repo. First run passed clean.
- **Plain-language explanation layer: done Sep 4, 2026 (evening)** — `explainCaseStatus()` (`src/lib/ai/explain.ts`, `ai` SDK + `Output.object`/zod, model `anthropic/claude-haiku-4.5` via AI Gateway, `claude-sonnet-5` documented as the upgrade path if quality is insufficient) wired into the dashboard: renders a plain-language explanation + general next steps next to the raw status, fails gracefully (raw status still shows) if the model call errors. Verified end-to-end against a real case via a temp isolated test route (deleted after use). Committed on `nextjs-app` (b47b0a0).
  - Getting this working required fixing an AI Gateway 403 (`Free tier users do not have access to this model`, later `BYOK is available only with paid credits`): upgraded team to **Pro**, bought a **$20 one-time AI Gateway credit top-up** (separate from the Pro plan subscription itself — easy to conflate, the first attempt mistakenly paid the Pro invoice instead), then added a personal Anthropic API key via AI Gateway **BYOK**. Budget for further AI Gateway credit top-ups as usage grows.
- Note: `npm run lint` is currently broken repo-wide (missing `eslint.config.js` for ESLint 9) — see next-build-priorities below.

**Target:** paid-tier launch ~Nov 30, 2026 (~12 weeks from a Sep 7, 2026 start). See the roadmap artifact below for the full week-by-week plan.

## Right now — confirm a checkable UI (do this first, it's quick)

**Resolved Sep 4, 2026.** The `nextjs-app` branch isn't just previewed — the separate `casewhy-app` Vercel project (`.vercel/project.json` → `prj_Zjis1TjZJO8FGqF93t12q169UCN9`) has `nextjs-app` configured as its **Production** branch (`vercel inspect` shows `target: production`), so every push to it deploys straight to a stable production URL, not a throwaway preview link:

- **https://casewhy-app.vercel.app** — stable alias, click this one
- https://casewhy-app-smarticos.vercel.app — same deployment, alternate alias
- https://casewhy-app-git-nextjs-app-smarticos.vercel.app — branch-specific alias, will always point at the latest `nextjs-app` push

Both `/` and `/dashboard` verified responding `200` after the Sep 4 push (commit `cd27577`, the explanation-layer work). This is separate from casewhy.com, which is still the `main`-branch static landing page on a different Vercel project — no change there.

**Update, same evening:** a real case lookup on that URL (`?receipt=EAC9999103403`) initially failed with "Something went wrong looking up your case" — the deployed app had no `USCIS_*` env vars set on Vercel at all (only the Neon Postgres integration vars were there; local `.env.local` and GitHub Actions CI secrets never got mirrored to the actual deployment). Added them via `vercel env add` — first attempt was itself broken (values in `.env.local` are double-quote-wrapped, e.g. `USCIS_CLIENT_ID="...ObeG"`, and the extraction script pushed the literal quote characters into Vercel, corrupting the OAuth client_id/secret); fixed by stripping the quotes and redeploying. **Verified working end-to-end in-browser** at `casewhy-app.vercel.app/dashboard?receipt=EAC9999103403`: status card, "What this means" explanation box, and history all render correctly. The dashboard + explanation layer are now genuinely checkable from anywhere, not just this machine.

## Next build priorities (added Sep 4, 2026, evening; #1 done later same evening)

Everything else open right now — the sandbox traffic log, the Florida LLC, the FOIA ticket — is either waiting on USCIS, the state, or just needs to run out its own clock. None of it blocks code work. In priority order, all fully actionable now:

1. ~~**Plain-language explanation layer.**~~ — **done Sep 4, 2026 evening**, see Product build above.

2. **START HERE — Persistent case tracking + minimal auth.** The dashboard is a one-off lookup right now — nothing is saved between visits. Needs: a way to save a receipt number as "the" tracked case (one free case per account per the MVP scope), some persistence (SQLite or a file-backed store is fine ahead of standing up real Postgres), and light auth — a magic-link/email flow beats building full password auth this early. This is also the prerequisite for scheduled polling and the status-change timeline described in the Architecture section below.

3. **File upload UI stub.** The live USCIS demo evaluates six things: UI usability, file upload, JSON payload handling, OAuth 2.0, error handling, case status tracking. The dashboard already covers most of these; file upload has no stub yet. Doesn't need to hit a real endpoint — a working upload control that accepts a file and confirms receipt is enough to satisfy the demo criterion.

4. **Fix `npm run lint`.** Missing `eslint.config.js` for ESLint 9 — quick fix, land before adding a lint step to CI.

5. **Email notifications** (SendGrid or Postmark) on a detected status change. Naturally last — depends on #2 (persistent tracking) existing first.

## Architecture (per the MVP scope doc)

- Frontend: Next.js, mobile-responsive, installable as a PWA (not a native app for v1)
- Backend: small API + a scheduled poll/diff job against the USCIS Case Status API (same cron pattern as Peter's NVDA trading journal and his personal N-400 Google Sheets tracker)
- Database: Postgres for accounts/case records, receipt numbers and case data encrypted at rest
- AI layer: a Claude API call on each detected status change — raw USCIS status text + a curated policy/case-law knowledge base → plain-language explanation + general next-step guidance (never case-specific legal advice)
- Notifications: SendGrid/Postmark for MVP email; push is a v2 addition
- Initial case-type scope: naturalization (N-400), family-based green cards, employment-based cases — not every USCIS form type

## Legal/compliance guardrails to build with, not bolt on

- Unauthorized-practice-of-law risk: keep all AI-generated guidance general and informational, sourced from public USCIS process docs, never a conclusion about *this specific user's* case. Always route case-specific questions to "talk to an attorney." Disclaimer/ToS language still needs a lawyer's review before launch (~$500-1,500 budgeted) — the live privacy policy is explicitly a draft pending that review.
- Data sensitivity: encrypt receipt numbers/case data at rest, minimize retention, never share/sell.
- Read the production-access affidavit's terms carefully during the access process — it may constrain commercial use, retention, or resale.
- Avoid the string "uscis" in any business-controlled identifier (see the email note above).

## Key files in this repo

- `README.md` — scaffold notes and the researched USCIS onboarding-process requirements (register → sandbox 5-day traffic → affidavit → live demo → production access)
- `src/lib/uscis/client.ts` — OAuth 2.0 client-credentials flow + `getCaseStatus()`, wired to the sandbox
- `src/lib/uscis/foia.ts` — FOIA Request and Status API client (`createFoiaCase()`, `getFoiaCaseStatus()`); implemented but live sandbox testing blocked, see above
- `src/app/dashboard/page.tsx` — dashboard, wired to `getCaseStatus()` and `explainCaseStatus()` (both done Sep 4)
- `src/lib/ai/explain.ts` — `explainCaseStatus()`, AI Gateway (Anthropic BYOK) + `ai` SDK + zod, done Sep 4
- `src/app/page.tsx` — landing page (email capture, no backend wired)
- `src/lib/config.ts` — env var loading/validation
- `.env.local` — sandbox credentials (gitignored)

## The fuller record

- **CaseWhy Launch Checklist** (live, checkable, synced via a shared database — this is the running source of truth for open items): https://claude.ai/code/artifact/c67d70aa-7b95-470d-9001-fe1182ffcc18
- **CaseWhy Launch Roadmap** (Gantt, 4 workstreams, 18 tasks, 4 milestones, Sep 7 – Nov 30 2026): https://claude.ai/code/artifact/0ad0e4c6-97d6-467c-ac9f-9ef3103d973c
- **USCIS Torch API onboarding execution spec**: https://claude.ai/code/artifact/8981ad84-0fb3-47a8-bc68-2f484d0db7bb
- **Ideas Claude Project** (claude.ai): `top-3-ai-business-ideas.md`, `top-3-b2c-app-ideas.md`, `immigration-case-companion-mvp-scope.md`

## Immediate next actions (roughly in order)

1. Log sandbox traffic Mon Sep 7 – Thu Sep 10 (days 2-5 of the 5-day requirement)
2. ~~Resolve Google Workspace domain verification~~ — confirmed done Sep 4, 2026 (Verified + Gmail activated)
3. ~~Rename the business contact email to drop "uscis"~~ — turned out unnecessary; the live pages never used the "uscis" placeholder (see note above)
4. File the Florida LLC
5. ~~Build the dashboard UI against `getCaseStatus()`~~ — done Sep 4, 2026
6. ~~`git init`/link this working copy to the existing GitHub repo; set up CI with sandbox creds as Actions secrets~~ — done Sep 4, 2026 (pushed to `nextjs-app` branch, CI passing)
7. Once the 5-day log is complete, email developersupport@uscis.dhs.gov to request the affidavit
8. ~~Send the drafted FOIA product-binding support email~~ — done Sep 4, 2026; awaiting USCIS response
9. ~~Build the plain-language explanation layer~~ — done Sep 4, 2026 evening
10. ~~Report the `nextjs-app` Vercel preview URL~~ — done Sep 4, 2026: it's a production URL, not a preview, see "Right now" above
11. Work through the rest of the "Next build priorities" list above, starting with persistent tracking/auth (#2) → file upload stub → lint fix → email notifications — none of it is blocked by 1, 4, or 7
