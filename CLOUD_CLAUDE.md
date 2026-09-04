# CaseWhy — Project Context for Claude Code

This file is the standing handoff between the cloud Claude session (which owns business/planning work and the artifacts below) and Claude Code sessions running here on the Fedora machine (which own the codebase). Read this first; update it — and tell the user to mention updates back to the cloud session — whenever a status below changes.

> **Last updated by Claude Code: Sep 4, 2026, ~11:15pm ET.** If you (cloud session) are reading a copy of this file fetched before that time, re-fetch it now before editing — an earlier stale-copy edit tonight silently reverted two already-resolved sections back to "unresolved" (see the process note under "Right now" below). Tonight's session, in order: shipped the plain-language explanation layer (fixing an AI Gateway 403 along the way), then persistent case tracking + magic-link auth (Neon Auth), then encrypted `tracked_cases.receipt_number` at rest per the standing compliance guardrail, then a file upload UI stub. All live on `casewhy-app.vercel.app`, CI green, everything pushed to `nextjs-app`. Only `npm run lint` and email notifications remain on the "Next build priorities" list.

## What this is

CaseWhy is an AI-explained USCIS case-status tracking web app. Existing trackers (Lawfully, US Case Tracker, VisaWatch) poll USCIS and show status. CaseWhy's differentiator: turn a status change or policy shift into a plain-language explanation and a concrete next action, instead of just a timestamp. Free tier: one tracked case. Paid tier (~$7-15/mo): multiple cases, faster notifications, an "ask a question" AI chat (v2). Secondary revenue: attorney-referral warm handoff.

## Origin

Peter spent 2026 exploring AI-leveraged business ideas he could build and run himself (15 years as a Solution Architect, wants to use AI for dev/marketing/ ops, B2C not B2B, $500-5,000 budget). CaseWhy was selected from a B2C shortlist on Sep 2, 2026. The idea is grounded in his own family's ordeal: N-400 naturalization applications for himself, his wife, and his daughter hit a 120+ day unexplained post-interview delay tied to a since-struck-down USCIS policy memo pausing naturalization for applicants born in ~39 "high-risk" countries — resolved only through a congressional inquiry and persistent follow-up. The product systematizes the plain-language status-tracking Peter built for his own case by hand.

Full background:

- Idea shortlist: "Ideas" Claude Project → `top-3-ai-business-ideas.md`, `top-3-b2c-app-ideas.md`
- Full MVP scope (architecture, legal risks, monetization, go-to-market): "Ideas" Claude Project → `immigration-case-companion-mvp-scope.md` — this is the source of truth for product/business decisions; this file is the source of truth for build status. **Correction Sep 4, 2026:** that doc is kept current by the cloud Claude session, not Claude Code — Claude Code doesn't have access to claude.ai Projects, so don't try to update it from here; report status back to this file (as always) and the cloud session will fold it in.

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
- **Persistent case tracking + minimal auth: done Sep 4, 2026 (late evening)** — magic-link sign-in via **Neon Auth** (managed Better Auth, `@neondatabase/auth`) and one Postgres table (`tracked_cases`, Drizzle + `pg`) enforcing one free tracked case per account. Signed-out visitors keep today's one-off lookup behavior unchanged (no forced sign-in); signing in adds a "Track this case" action, and a bare `/dashboard` visit auto-loads the signed-in user's saved case. Verified end-to-end in-browser on the live `casewhy-app.vercel.app` deployment: sign-in email arrives, magic link signs in, tracking persists across reloads, sign-out reverts to anonymous view.
  - Three real bugs hit and fixed along the way, all worth knowing about if Auth acts up again: (1) `@neondatabase/auth` peer-requires Next.js ≥16 while this app is on 15 — installed with `--legacy-peer-deps` and added `.npmrc` (`legacy-peer-deps=true`) so Vercel's build does the same; works fine in practice. (2) Neon Auth itself wasn't enabled on the project yet (Neon Console → project → Auth → "Enable Neon Auth"), and separately the **Magic Link plugin specifically** was off by default even after enabling Auth (Console → Auth → Plugins tab → toggle "Enable Magic Link" — email+password auth is on by default, magic link is not). (3) `NEON_AUTH_BASE_URL` in `.env.local`/Vercel was stale — pointed at a different, non-existent Auth endpoint hostname than the one Neon actually provisioned once Auth was enabled; had to re-pull the real "Auth URL" from Neon Console (Auth → Configuration tab) and fix it in both places. Also had to add `https://casewhy-app.vercel.app` to Neon Auth's trusted-domains allowlist (Console → Auth → Configuration → Domains) or every callback fails with `INVALID_CALLBACK_URL`.
  - ~~**Known gap against the compliance guardrails below:** `tracked_cases.receipt_number` was stored as plain text.~~ — **fixed Sep 4, 2026, same night**, user called it a hard requirement. `src/lib/db/crypto.ts` adds app-level AES-256-GCM (Node's built-in `crypto`, no new dependency) — encrypt on write in `trackCase()`, decrypt on read in `getTrackedReceiptNumber()`, with an undecryptable row (e.g. old pre-encryption data) treated as "no tracked case" rather than crashing. Key lives in a new `ENCRYPTION_KEY` env var (`.env.local`, Vercel Production/Preview, GitHub Actions secret — same three-places pattern as the other secrets). Verified in production: raw Postgres value is 56-byte ciphertext with no plaintext receipt number present, and decrypt round-trips correctly through the dashboard.
- **File upload UI stub: done Sep 4, 2026 (late night)** — `src/app/dashboard/FileUploadStub.tsx`, rendered in `StatusCard` under "Supporting documents." Accepts a pdf/jpg/png and confirms receipt locally (no real endpoint yet, per the scope this priority was explicitly given). Verified in production: uploading a file renders "Received `<name>` (`<size>`)". This closes the last unstubbed criterion of the six the live USCIS demo evaluates (UI usability, file upload, JSON payload handling, OAuth 2.0, error handling, case status tracking) — all six now have working UI to show.

**Target:** provisionally pulled forward to ~Nov 13, 2026 (was Nov 30) — the roadmap Gantt was updated Sep 4, 2026 evening after an audit found it (and the Ideas project doc) had drifted from actual status. The affidavit can go in ~17 days earlier than first estimated (5-day traffic log finishes Sep 10, not ~Sep 25), so the whole downstream chain shifted with it. Still provisional — depends on USCIS's own review taking about the same ~4 weeks as originally estimated. See the roadmap artifact below for the full updated week-by-week plan.

## Right now — confirm a checkable UI (do this first, it's quick)

**Resolved Sep 4, 2026 — re-confirming after this section got reverted to its pre-resolution text by a stale save from the cloud session (see note at the bottom of this section).** The `nextjs-app` branch isn't just previewed — the separate `casewhy-app` Vercel project (`.vercel/project.json` → `prj_Zjis1TjZJO8FGqF93t12q169UCN9`) has `nextjs-app` configured as its **Production** branch (`vercel inspect` shows `target: production`), so every push to it deploys straight to a stable production URL, not a throwaway preview link:

- **https://casewhy-app.vercel.app** — stable alias, click this one
- https://casewhy-app-smarticos.vercel.app — same deployment, alternate alias
- https://casewhy-app-git-nextjs-app-smarticos.vercel.app — branch-specific alias, will always point at the latest `nextjs-app` push

This is separate from casewhy.com, which is still the `main`-branch static landing page on a different Vercel project — no change there.

A real case lookup on that URL initially failed with "Something went wrong looking up your case" — the deployed app had no `USCIS_*` env vars set on Vercel at all. Fixed by adding them via `vercel env add` (had to strip stray double-quotes that `.env.local`'s formatting carries but Vercel doesn't). **Verified working end-to-end in-browser**, and now also verified again after the Sep 4 late-evening persistent-tracking/auth work below — see that section for what's new.

**Process note for the cloud session:** this section (and item #10 in "Immediate next actions") got reset back to the unresolved "check for a preview URL" text in a later save, overwriting the resolution recorded here — almost certainly because that save was working from a copy of this file fetched before the resolution was written, not a deliberate re-open. This file has no real-time sync between the two sessions, so if Claude Code has updated a section recently, re-fetch this file immediately before editing it rather than editing a cached copy, to avoid clobbering fresh status.

## Next build priorities (added Sep 4, 2026, evening; #1 and #2 done later same evening/night)

Everything else open right now — the sandbox traffic log, the Florida LLC, the FOIA ticket — is either waiting on USCIS, the state, or just needs to run out its own clock. None of it blocks code work. In priority order, all fully actionable now:

1. ~~**Plain-language explanation layer.**~~ — **done Sep 4, 2026 evening**, see Product build above.

2. ~~**Persistent case tracking + minimal auth.**~~ — **done Sep 4, 2026 late evening**, see Product build above. Note the open encryption-at-rest gap flagged there.

3. ~~**File upload UI stub.**~~ — **done Sep 4, 2026, late night.** `src/app/dashboard/FileUploadStub.tsx`, rendered inside the case's `StatusCard` under "Supporting documents": accepts a pdf/jpg/png, confirms receipt locally ("Received `<name>` (`<size>`)") — no real endpoint yet, matching the doc's own explicit scope for this pass. Verified end-to-end in production (uploaded a real file via the browser, confirmation rendered correctly). This closes the live-demo criterion gap; all six demo-evaluated things (UI usability, file upload, JSON payload handling, OAuth 2.0, error handling, case status tracking) are now covered.

4. **START HERE — Fix `npm run lint`.** Missing `eslint.config.js` for ESLint 9 — quick fix, land before adding a lint step to CI.

5. **Email notifications** (SendGrid or Postmark) on a detected status change. Naturally last — depends on persistent tracking (done above) existing first.

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
- `src/app/dashboard/page.tsx` — dashboard, wired to `getCaseStatus()`, `explainCaseStatus()`, and (Sep 4 late evening) the signed-in tracked-case auto-load
- `src/app/dashboard/actions.ts` / `TrackCaseButton.tsx` — server action + client button for saving a tracked case
- `src/app/dashboard/FileUploadStub.tsx` — local-only file upload UI (no real endpoint), done Sep 4 late night
- `src/lib/db/crypto.ts` — AES-256-GCM app-level encryption for sensitive columns, done Sep 4 late night
- `src/lib/ai/explain.ts` — `explainCaseStatus()`, AI Gateway (Anthropic BYOK) + `ai` SDK + zod, done Sep 4
- `src/lib/auth/server.ts` / `client.ts` — Neon Auth (`@neondatabase/auth`) server instance + React client, done Sep 4 late evening
- `src/app/api/auth/[...path]/route.ts` — Neon Auth's catch-all handler route
- `src/app/auth/sign-in/page.tsx` — custom magic-link sign-in form
- `src/components/AuthHeader.tsx` — sign-in/out header, client-side session check (kept out of the root layout's server rendering so the static landing page stays static)
- `src/lib/db/schema.ts` / `client.ts` — Drizzle schema (`tracked_cases`) + lazy `getDb()`; migrations in `src/lib/db/migrations/`
- `src/app/page.tsx` — landing page (email capture, no backend wired)
- `src/lib/config.ts` — env var loading/validation
- `.env.local` — sandbox credentials + Neon/Auth vars (gitignored)
- `.npmrc` — `legacy-peer-deps=true`, needed for `@neondatabase/auth`'s Next 16 peer requirement on this Next 15 app

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
11. ~~Build persistent case tracking + minimal auth~~ — done Sep 4, 2026 late evening, see Product build above
12. ~~Decide and implement encryption-at-rest for `tracked_cases.receipt_number`~~ — done Sep 4, 2026, same night, see Product build above
13. ~~Build the file upload UI stub~~ — done Sep 4, 2026, late night, see Product build above
14. Work through the rest of the "Next build priorities" list above — lint fix → email notifications — none of it is blocked by 1, 4, or 7
