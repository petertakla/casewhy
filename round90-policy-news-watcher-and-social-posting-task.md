# New task for Claude Code — round 90: policy/news watcher → X / Threads, posted from the queue (LinkedIn deferred)

**Status: authorized Sep 14, 2026, depends on round 89 (the** **marketing_queue****). Revised Sep 15: LinkedIn deferred and a language-sequencing rule added (Section 4) — Peter's decisions.** This is the "same-day reaction to policy/court news" cadence from the Free Marketing Playbook, made real without Peter watching the news. Guardrails Section 4 for LinkedIn/X/Threads applies strictly: **sourcing over speed** — a thread that can't cite its source is not queued.

## What to build

### 1. Watcher

A cron (every 30–60 min, same bearer-secured /api/cron/* + cron-job.org pattern as poll-community) that polls:

- USCIS Newsroom (alerts + news releases RSS), USCIS Policy Manual updates page, USCIS "Policy Memoranda" page
- Federal Register — documents from DHS/USCIS/State (the API supports agency filters)
- Visa Bulletin page (monthly; already hand-captured for CW-34 — this just detects a new month and flags the KB refresh)
- Court feeds: CourtListener RSS for immigration-related dockets (config list; start with the cases the KB already references)
- A small config list of high-signal secondary sources (e.g., AILA public news page) — read-only, cited as "via AILA," never the sole source

Dedupe by URL + title hash. Store each new item in a news_items table with source_url, published_at, raw_summary, kb_related_memo_ids (match against the existing policy KB so drafts can link CaseWhy's own permalink pages later).

### 2. Drafting

For each new item, generate one queue entry per channel it fits, using the guardrails prompt from round 89 plus channel formatting:

- **X** — thread of 3–6 posts: what changed, who it affects (procedurally, never "you should"), source link as the first reply, "CaseWhy tracks this — full disclosure, I built it" only when links_enabled (off until production).
- **Threads** — same content, single longer post.
- **LinkedIn Company Page** — **deferred (Sep 15).** CaseWhy's users are 30–40% Spanish-speaking and mostly not on LinkedIn; keep linkedin in CHANNEL_LABELS as a manual_post channel with no drafts generated for it. Do not build a LinkedIn poster in this round. LinkedIn's only near-term use is the round 94 attorney campaign (B2B).

All go into the queue in auto_post mode. If the model can't identify a primary source, queue as escalated with the item, not as a draft.

### 3. Posters

- **X** — X API v2 (Peter creates a developer project on the CaseWhy account; Basic tier is enough for a few posts/day — cost on Peter's checklist to confirm).
- **Threads** — Threads API via a Meta app (Peter creates the app and links the CaseWhy Threads/Instagram account).
- **LinkedIn** — not built (deferred, see Section 2).

Posting only happens on an approval click in the round 89 queue. Record posted_url back on the item.

### 4. Language sequencing — English first, Spanish second

Peter's decision, Sep 15: **English social pages launch first; Spanish social pages come second.** For this round that means:

- Drafts are English-only until the English X and Threads accounts have posted for at least two weeks and Peter says go. Add a locale column to marketing_queue (default en) now so the Spanish phase is a config change, not a schema change.
- When Peter enables Spanish (a marketing_settings flag, spanish_social_enabled, default false, editable on /admin/marketing/settings), the watcher generates a second draft per item in formal *usted* Spanish, targeted at separate Spanish accounts (@casewhy_es or equivalent — Peter creates them then; add to his checklist at that time, not now). Spanish drafts are queued and approved exactly like English ones and show an "ES" chip on the card.
- Do not machine-translate English drafts word for word — the Spanish draft is generated from the source item with the same guardrails prompt, in Spanish.

### 5. Nothing else changes

No replies to comments on those posts (Peter or the cloud session handles them manually; guardrails Section 3 escalation rules apply). No auto-follow, no DMs.

## Peter's one-time steps

- X developer project + keys; Meta developer app + Threads account link. (LinkedIn page-admin check dropped — deferred.)

## Verify live

- Post a known-old USCIS news item into the watcher's test path and confirm one queued draft per channel with the source as the first citation.
- Approve an X draft and confirm the thread appears in order with the source reply.
- Confirm an item with no identifiable primary source lands as escalated.
- locale column present and defaulting to en; spanish_social_enabled visible (off) on the settings page; with it on in a test env, a Spanish draft is generated with the ES chip.

---

## Claude Code build notes (Sep 15, 2026)

Shipped with two real, verified deviations from the task doc's own source list, and two real bugs found (and fixed) along the way.

**CourtListener and AILA left out**, checked live rather than guessed: CourtListener's unauthenticated RSS search is a full-text search across all filings, not docket-scoped — even an exact case-name query for the DACA case returned an unrelated case entirely, and precise docket tracking needs an authenticated API token Peter doesn't have (confirmed a real 401 without one). AILA has no discoverable RSS feed on either its news page or homepage. Shipping either risked violating the guardrails' own "sourcing over speed" rule more than leaving them out — see CLOUD_CLAUDE.md's Round 90 entry for the full reasoning and what was verified in their place: USCIS Newsroom, USCIS Policy Memoranda (found via navigating from the real Laws & Policy page, not the task doc's own guessed URL, which 404'd), Federal Register DHS/USCIS/State, and a small scraper for the USCIS Policy Manual updates page (no RSS, but a clean stable structure).

**Guardrails doc itself needed a real fix first**: `SOCIAL_MEDIA_GUARDRAILS.md` Section 0 still prohibited all automated posting — round 89's own build notes claimed this had already been revised, but the file's git history showed it was never actually edited. Fixed for real before writing any auto_post code for this round.

**Two real bugs found via the first actual exercise of the auto-post failure path** (no channel's poster had ever thrown before this round): a failed poster call left the queue row at a status invisible in both admin views (fixed: reverts to pending), and the failure error was being thrown from a Server Action, which Next.js redacts from the client in production (fixed: returned as data instead, the same fix round 107 already established for exactly this class of bug — missed here once, caught via a real live click, fixed the same day).

Verified live against real production data: the watcher found 50 real items across all 6 sources on its first real run, drafted a correct 4-post X thread + Threads post for a real USCIS H-2B cap alert (source correctly inserted as the thread's first reply), and correctly escalated five Federal Register paperwork-burden notices instead of padding them into fake takes.

Full writeup: `CLOUD_CLAUDE.md`, "Round 90."
