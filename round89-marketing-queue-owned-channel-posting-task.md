# New task for Claude Code — round 89: generalize the community-reply queue into a marketing queue with owned-channel posting

**Status: authorized Sep 14, 2026. Numbered against CLOUD_CLAUDE.md (max was 88 on Sep 14; rounds 89–96 reserved by the cloud session the same day — see round 95's standing rule).** Peter approved the marketing ownership model (`claude_marketing-ownership-and-peter-checklist`): Code builds pipelines, the cloud session drafts/reviews, Peter approves from one queue and does the "utmost minimum." This round is the foundation rounds 90–92 plug into.

**Builds on, does not replace:** round 85's `pendingCommunityReplies` table, `/admin/community-replies`, `PendingCommunityReplyCard.tsx`, `classify-thread.ts`, `reddit-client.ts`, `/api/cron/poll-community`; round 70's alias approval pipeline; round 84's backlink-outreach drafts. Don't build a second queue — extend what exists, and keep the "Approved — ready to post" copy for community channels exactly as round 85 shipped it.

**Read alongside:** `SOCIAL_MEDIA_GUARDRAILS.md` — Section 0 revised Sep 14 (repo mirror needs updating from the Drive copy `claude_casewhy-social-media-guardrails`): community channels stay manual-post; owned channels (X, Threads, LinkedIn page, Pinterest, YouTube, TikTok, Instagram, email, blog) may be posted by code **after** Peter's approval click.

## What to build

### 1. One queue, two modes

Add to the existing pending-reply model (or a sibling `marketingQueue` table sharing the same admin UI — pick whichever is less churn, note the choice):

- `channel` — extend the enum: `reddit`, `immigration_com`, `facebook`, `quora` (manual, from round 85) + `x`, `threads`, `linkedin`, `pinterest`, `youtube`, `tiktok`, `instagram`, `email`, `outreach`
- `mode` — `manual_post` (round 85 behavior: approval marks text ready, Peter pastes) or `auto_post` (on approval, code calls the channel's registered poster — rounds 90/91/92 register them)
- `draft_text`, `media_refs` (for round 91 assets), `source_citations[]`, `guardrail_notes`, `destination`
- `status` — keep round 85's `pending/approved/rejected/skipped`; add `posted` and `edited_posted` (both used only by `auto_post` on success, and by Peter's "I posted this" click on `manual_post` items so the log is complete), plus `escalated` (no draft, reason only — already the shape round 85's crisis/EO-14161 pre-check produces)
- `posted_at`, `posted_url`, `utm_link` (round 93 fills this)

Hard rule, unchanged from rounds 70/85: nothing in `auto_post` ever posts without an approval click; `manual_post` never posts at all.

### 2. Poster registry

`src/lib/marketing/posters/<channel>.ts` with a common interface `post(item) → { url }`. This round ships the interface and a `noop` poster; rounds 90–92 add real ones. If a channel's poster isn't configured (missing env), the queue UI shows the item as `manual_post` with the text ready to copy instead of failing.

### 3. Three small additions to round 85's monitor

- **Dedup** — hash-compare a new draft against the last 30 days; skip near-duplicates (guardrails Section 1).
- **Volume cap** — config, default 5 community drafts/day (round 85 targeted 8–10 candidates; Peter's daily job should be ~5 minutes).
- **`links_enabled` flag** — global, default `false`. Drafts include no CaseWhy URL while false. Round 96 flips it after the production gate.

### 4. Log view

`/admin/marketing/log`: per channel, counts of drafted / approved / posted / edited / rejected / escalated, last 7 and 30 days, CSV export. The cloud session reads this weekly. (Guardrails Section 6.)

## Still open from round 85/87, not this round's to solve — just don't regress them

Reddit Responsible Builder approval (ticket submitted Sep 14), cron-job.org registration of `poll-community`, Gmail filters (needs the wider delegation scope). Peter's steps for each are already written in round 87 / the Sep 14 status entries; per round 88, restate them with full URLs in this round's report only if their state changed.

## Verify live

- An existing round-85 draft still renders and approves exactly as before.
- A test `auto_post` item with the `noop` poster moves to `posted` only after an approval click, never on creation.
- Two near-identical candidate threads yield one draft.
- The cap stops drafting at the limit and the log view shows the skipped count.
- tsc/lint clean, production build succeeds, deployed. Fold into CLOUD_CLAUDE.md referencing rounds 70, 84, 85.
