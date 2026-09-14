# New task for Claude Code — round 73: marketing approval queue + community thread monitor

**Status: authorized Sep 14, 2026.** Peter approved the marketing ownership model in `marketing-ownership-and-peter-checklist.md`: Claude Code builds the pipelines, the cloud Claude session drafts and reviews content, Peter approves from a queue and does the "utmost minimum." This round is the foundation every other marketing round (74–78) plugs into, so it goes first.

**Read alongside:** `casewhy-social-media-guardrails.md` (Section 0 was revised Sep 14 to allow code-posting on *owned* channels after approval; community channels stay manual-post), and round 70's approval-queue design (`round70-domain-response-aliases-task.md`) — this round **extends that queue, not a second one.**

## What to build

### 1. Generalize round 70's pending-approval queue into a `marketing_queue`

One queue, one admin screen (or the Gmail-Drafts variant, whichever round 70 shipped — keep the same choice), with a `kind` column so alias-email replies and marketing drafts live side by side. Each item carries:

- `channel` — `reddit`, `facebook`, `visajourney`, `trackitt`, `immigration_com`, `quora`, `x`, `threads`, `linkedin`, `pinterest`, `youtube`, `tiktok`, `instagram`, `email`
- `mode` — `manual_post` (Peter copies and posts himself; the queue just shows the text + destination URL + a "Mark posted / edited / rejected" control) or `auto_post` (on approval, code posts via the channel's API — rounds 74/75/76 register their posters here)
- `destination` — thread URL or "new post"
- `draft_text`, `source_citations` (list), `guardrail_notes` (the Section 5 review-workflow fields: which guardrail sections were checked, anything borderline)
- `status` — `pending`, `approved`, `posted`, `edited_posted`, `rejected`, `escalated`
- `posted_at`, `posted_url`, `engagement_snapshot` (optional, filled by round 77's attribution job)

Hard rule carried over from round 70: **nothing in `auto_post` mode ever posts without an approval click.** `manual_post` items never post at all — they only get marked.

Escalations (guardrails Section 3 — legal-advice requests, hostile threads, moderator pushback, EO 14161 vetting questions, first post in a new community) enter the queue with `status = escalated` and **no draft text**, just the thread and the reason.

### 2. Community thread monitor (the source for `manual_post` items)

A cron (same infrastructure as `check-status/route.ts`) that finds answerable questions and files a drafted reply in the queue:

- **Reddit** — official API (OAuth script app on Peter's account; Peter creates the app at reddit.com/prefs/apps — one-time, on his checklist). Poll new posts in r/USCIS, r/immigration, r/n400, r/greencard, r/i130, r/i485, r/USCISFamilyBased (make the list config-editable). Filter for question posts matching the KB's covered topics (status meanings, RFEs, processing times, visa bulletin, interview prep, case delays). **Read-only** — the API is used to read, never to post, per guardrails Section 4.
- **VisaJourney / Trackitt / immigration.com** — RSS/new-thread feeds where they exist; otherwise a polite scraper of the "new threads" page at a low rate (respect robots.txt; once an hour is plenty).
- **Facebook groups and Quora** — no usable read API. Skip automated discovery; the cloud session will hand Peter candidate threads for these manually. Leave the channel values in the enum so drafts for them can still be queued by hand.
- **Drafting** — call the same model/KB stack the in-app chat (CW-32) uses, with a marketing-reply system prompt that encodes guardrails Sections 1–2 verbatim: informational only, no case-specific guidance, never quote identifying detail, cite a USCIS source inline for any factual claim, disclosure line whenever CaseWhy is mentioned, no links at all until the After Production gate (a config flag `links_enabled`, default false — round 79 flips it). Run the "answer before a pitch" test: if the draft mentions CaseWhy, generate the same draft without the mention and only keep the mention if the reply still stands alone.
- **Dedup** — never draft near-identical text for two threads (guardrails Section 1); hash-compare against the last 30 days of drafts.
- **Volume cap** — configurable, default 5 drafts/day across all community channels. Peter's job is 5 minutes/day, not a firehose.

### 3. Logging (guardrails Section 6)

The queue table *is* the log. Add a `/admin/marketing/log` view with per-channel counts of drafted / posted / edited / rejected and a CSV export — the cloud session reads this weekly.

## Peter's one-time steps (on his checklist)

- Create the Reddit API app and paste the client id/secret into the env.
- Nothing else — the queue is behind the existing admin auth.

## Out of scope

Posting anywhere. Any Facebook/Quora automation. Turning on product links (round 79, gated on production).

## Verify live

- A real r/USCIS question produces a queued draft with a citation, guardrail notes, and no link.
- An "am I going to get denied?" style post lands as `escalated` with no draft.
- Two similar threads do not produce two similar drafts.
- Marking an item posted records it in the log view.
