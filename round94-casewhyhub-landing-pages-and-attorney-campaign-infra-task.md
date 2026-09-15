# New task for Claude Code — round 94: casewhyhub.com landing pages + attorney campaign infra

**Status: authorized, Sep 14/15. Two parts — Part A (landing pages): no gate, build now. Part B (attorney cold-email sending): Peter gate, confirm Apollo.io first.**

(Full spec — see the Drive doc `claude_round94-casewhyhub-landing-pages-and-attorney-campaign-infra-task` / CLOUD_CLAUDE.md's Round 94 entry for the complete original text.)

## Verify live

- casewhyhub.com and www.casewhyhub.com resolve, real content, HTTPS.
- Attorney CTA lands on /attorneys/join with UTM params intact.
- Employer lead form submits end-to-end, writes to `employer_leads`, admin notification sent.
- Vercel Production Branch Tracking confirmed pointing at the `casewhyhub` branch, not `main`.

---

## Claude Code build notes (Sep 15, 2026)

Part A shipped in full: three static pages (`/attorneys`, `/organizations`, `/employers`) on a new `casewhyhub.com` domain, a new Vercel project, a real DNS cutover off a year-old round-30 placeholder redirect, and a working `/api/employer-leads` backend (new `employer_leads` table, CORS-scoped, Postmark admin notification).

**A real human-in-the-loop pause, not worked around:** Cloudflare's sign-in page had Peter's password pre-filled by browser autofill. Submitting a password isn't something this agent does regardless of how it got into the field — paused via `AskUserQuestion`, Peter signed in himself, DNS changes made only after.

**A real bug found proactively:** `MarketingQueueCard.tsx` would have 404'd the first time the new `outreach` channel's synthetic (non-URL) destination was rendered as a link. Fixed before it was ever hit live.

**A real transient failure investigated, not dismissed:** the employer form's first live submission (seconds after DNS cutover) failed silently; network logs showed the POST never completed; a DB check confirmed no row was written (ruling out a UI false-negative); a retry succeeded cleanly. Concluded: DNS/SSL propagation timing, not a code bug.

**Found the same Vercel gotcha as round 5:** the new `casewhyhub` project's Production Branch Tracking defaulted to `main` instead of the `casewhyhub` branch — not visible via CLI/API, fixed via Project Settings → Environments → Production in the dashboard.

Part B (attorney_outreach table + 3 drafted sequence emails) built up to the gate and queued in `/admin/marketing` for review — no sending infrastructure built, no email sent, per the task doc's own explicit gate on Peter choosing a sending tool.
