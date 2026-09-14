# CaseWhy Marketing Operations — Operator Manual

**Version 1, Sep 14, 2026. Audience: anyone working the marketing queues** — Peter today, a part-time helper or VA later. Written by the cloud Claude session from the round 85/89 specs and Claude Code's build reports; **Claude Code verified every screen label against the live UI before publishing this version.** Sections marked *(coming — round NN)* describe behavior that is specified but not yet built; they will be unmarked as each round ships.

**Companion documents:** `SOCIAL_MEDIA_GUARDRAILS.md` (the rules every draft is checked against — read it once in full before your first shift), `marketing-ownership-and-peter-checklist.md` (who does what), `CaseWhy Free Marketing Playbook` (why each channel exists).

---

## 1. The one idea behind everything

CaseWhy never posts anything a human hasn't approved. Software finds the opportunities and writes the drafts; a person reads each one and clicks. There are two kinds of channel, and the click means different things on each:

| | Community channels | Owned channels |
|---|---|---|
| Which | Reddit, immigration.com, Facebook groups, Quora, other forums | X, Threads, LinkedIn Company Page, Pinterest, YouTube, TikTok, Instagram, the email list, the `/updates` blog, attorney outreach |
| Whose space | Someone else's | Ours |
| What "Approve" does | Marks the text **ready for you to copy and post yourself**, from your own logged-in account. Nothing is sent by software, ever. | Software posts or sends it for you, once, right after you click. |
| Queue mode label | `manual_post` | `auto_post` |

If a channel's posting integration isn't set up yet, an owned-channel item behaves like a community item: you get the text to copy. The queue tells you which is which on every card. As of this version, only one owned channel actually has a real poster wired up — the `/updates` blog (round 93). X/Threads/LinkedIn, Pinterest/YouTube/TikTok/Instagram, and email all still fall back to manual-post framing until rounds 90–92 ship.

---

## 2. Where the queues live

Admin pages need you to be signed in as the admin account — **`admin@casewhy.com`** (a dedicated admin credential, separate from the public `info@casewhy.com` inbox, since round 85). Anything else gets redirected away.

| Page | What it holds | Round |
|---|---|---|
| `app.casewhy.com/admin/marketing` | **The marketing queue** — every Pending and Escalated item, newest first. This is the page you open every day. (No channel/status filter controls exist — the page is always scoped to just these two statuses; see Section 3.) | 89 |
| `app.casewhy.com/admin/marketing/log` | Per-channel counts across every status, all-time, plus a **Download CSV** link. You don't work this page; the cloud session reads it weekly. | 89 |
| `app.casewhy.com/admin/marketing/attribution` | Which channel brought which sign-ups (landings / sign-ups / tracked a case / went Plus). Read-only. **Live**, not upcoming. | 93 |
| `app.casewhy.com/admin/community-replies` | The original community-only queue from round 85. **Removed.** Round 89 replaced it with `/admin/marketing`; this URL now returns a plain 404, it does not redirect. | 85 (retired) |
| `app.casewhy.com/admin/inbox` | Replies to mail sent to `privacy@`, `help@`, `corrections@`, etc. **Separate system, deliberately** — business correspondence, not marketing. Not covered by this manual. | 70 |

---

## 3. Your daily routine (target: five minutes)

1. Open `/admin/marketing`. It's always scoped to Pending and Escalated items only — there's no filter to set.
2. For each card, read what it shows (Section 4). Decide: **mark it posted after you post it yourself** (community/manual channels), **Approve** (owned channels with a real poster), or **Reject**.
3. For `manual_post` items you've posted: copy the final text, open the destination link, post it from your own account, come back, click **Mark posted (as-is)** (or **Mark posted (edited)** if you changed the text first).
4. Look at anything marked **Escalated** (Section 6). Those need a human read and either **Acknowledge / dismiss** once you've decided.
5. Close the tab. Don't go looking for more threads to answer — the monitor's daily cap is set low on purpose so this stays a five-minute job.

If you approve nothing on a given day, nothing goes out. The system is safe to ignore for a day; it just accumulates.

Note: **Skipped** items (the classifier decided a thread wasn't a real fit and never drafted) never appear on this page — they're pending/escalated only. Skipped counts only show up on the log page (Section 9), for the cloud session to review.

---

## 4. Reading a queue card

Every card actually shows, in this order:

**Channel and mode**, top-left — e.g. "Reddit · manual — you post this yourself" or "Blog · auto-post (will post on approval)."

**Destination.** A link to the exact thread (or the post's own path, for owned-channel content). Open it before approving a community reply; the thread may have moved on.

**Guardrail notes.** A short line on how the draft was checked, or (for an Escalated card) the reason a human needs to decide instead. If this says anything that reads as a warning, slow down.

**Sources** ("Grounded in: ..."). Every factual claim should trace to a real source link here. A draft with a factual claim and nothing listed here is a draft to reject — the monitor is supposed to skip those, so one getting through is worth a note to the cloud session.

**Draft text**, in an editable box. The exact words proposed — edit directly in this box if you want to change anything before acting; there's no separate "edit mode," typing here *is* the edit.

What the manual originally described but the live UI does **not** currently show as separate elements: a structured "self-promo rule" note, and a visible "links enabled/disabled" indicator. Today, anything like that is folded into the guardrail-notes text if the draft mentions it, not a distinct field on the card.

---

## 5. The real decisions available on a card

The live UI doesn't have a generic "Approve" / "Edit" / "Leave it pending" set of buttons — what you actually see depends on the card:

**Escalated cards** (amber, no draft text): one button, **Acknowledge / dismiss**. There's no separate "Handled" vs. "Left" state — dismissing just clears it from the queue (recorded as `rejected`). Read the thread yourself first; decide whether to reply as yourself (never as CaseWhy) or leave it, *then* dismiss.

**`manual_post` cards** (every community/forum channel, and any owned channel without a real poster yet): **Mark posted (as-is)**, **Mark posted (edited)** (only enabled once you've actually changed the text), and **Reject**. There's no separate approve step — posting is something you do yourself outside the app, then you come back and mark it.

**`auto_post` cards with a real poster** (currently: Blog only): **Approve (queue for auto-post)** and **Reject**. Approve is the one and only thing that makes the post go live — nothing else does.

**Reject** on any card is permanent; rejected items aren't retried. If you reject several drafts for the same reason, tell the cloud session — that's a prompt fix, not something you should keep doing by hand.

Leaving a card alone is fine for a day. After that, reject it — a community reply that's two days late reads worse than no reply.

---

## 6. Escalated items — the ones the software refuses to draft

An item shows as **Escalated** (amber-highlighted, "Flagged — no draft") when the guardrails say a human must decide. The categories (guardrails Section 3):

- The post reads as asking for legal advice about their specific situation.
- The commenter is hostile or clearly bad-faith.
- The thread already has moderator pushback or a self-promo warning.
- It's about the EO 14161 social-media vetting rule — anxious topic, deserves a calibrated human answer.
- It would be the first-ever post in a community CaseWhy has no track record in.
- **Crisis language** (self-harm or similar). Never reply as CaseWhy. If you reply at all, do it as a person, with the platform's crisis resources, and tell Peter.

What to do: read the thread, decide whether to answer as yourself (without CaseWhy), or leave it. Then click **Acknowledge / dismiss** so it clears. Escalations never get an auto-generated draft, even if you ask.

---

## 7. Channel-specific notes

**Reddit.** Post from the Reddit account tied to `peter@casewhy.com`. Check the subreddit's self-promo rule (folded into the card's guardrail notes, not a separate field — see Section 4). No links until launch. If a moderator removes a post, screenshot it and tell the cloud session — the guardrails doc gets tightened, not just the one post.

**immigration.com and other forums.** Same rules as Reddit. The immigration.com feed is mostly firm announcements, so expect few drafts from it.

**Facebook groups and Quora.** The software does not monitor these (no API, and scraping would risk the account). The cloud session hands you candidate threads and drafts by hand, and they land in the queue like any other `manual_post` item. Post in your own voice; no links until a group admin has said yes.

**X / Threads / LinkedIn** *(auto-posting coming — round 90)*. Until then these are `manual_post`: copy the thread and post it yourself. Once round 90 ships, Approve posts it. Policy-news threads are time-sensitive — if one is more than a day old when you see it, reject it.

**Pinterest / YouTube Shorts / TikTok / Instagram** *(coming — round 91)*. Cards will carry an image or video preview plus caption. Look at the image: a headline the renderer garbled, a wrong logo, anything that looks off — reject, don't edit. The pipeline re-renders.

**Email issues** *(coming — round 92)*. One card per weekly issue, with subject, preview text, and full body. Approve = send to the whole list on the next Tuesday run. This is the one channel where a typo reaches every subscriber at once, so read the whole thing.

**Blog posts.** **Live (round 93), not upcoming.** One card per `/updates` post, channel label "Blog," `auto_post` mode with a real poster registered — **Approve genuinely publishes it**: the post's file already exists in the repo, and clicking Approve is the one thing that flips it from invisible to live at `/updates/<slug>`. There is no undo button; if you need to unpublish, tell the cloud session.

**Attorney outreach** *(coming — round 94)*. The three sequence emails appear once for approval; after that, sends happen from the outreach tool and only replies come back through the round 70 alias queue (`/admin/inbox`). Complaint or bounce rates above the thresholds pause the sequence automatically.

---

## 8. Things you cannot change from the queue (and who can)

- **Product links are off** (`links_enabled = false`) until the paid tier and USCIS production access are both live. Drafts won't contain a CaseWhy URL and you shouldn't add one. Round 96 flips this; only Peter authorizes it.
- **The daily cap** (default 5 community drafts/day) is a value in the code (`src/lib/marketing/config.ts`), not something editable from any page — ask the cloud session to change it.
- **The subreddit list** *is* stored in an editable database table (`community_source_configs`), but there is currently **no admin page** to view or edit it — nobody can see or change it without a direct database script. Ask the cloud session to change it, same as the cap, until a page exists.
- **The guardrails** are a document, not a setting. Nobody edits them casually — every change is dated and explained in the file.

---

## 9. Weekly (cloud session's job, listed so you know it exists)

Every Monday the cloud session reads `/admin/marketing/log` and the attribution digest (round 93, live — a weekly email to `info@casewhy.com` on Mondays covers the same numbers), checks approval and rejection rates by channel, tops up the content-brief and email-issue backlogs, and flags anything needing Peter's decision in one line. If rejection rates on a channel go above about a third, the drafting prompt for that channel gets revised — that's the feedback loop your Reject clicks feed.

---

## 10. Troubleshooting

| You see | It means | Do |
|---|---|---|
| Redirected away from `/admin/marketing` | Not signed in as the admin account | Sign in as `admin@casewhy.com` |
| Queue empty for days | Reddit polling not yet enabled (waiting on Reddit's API approval), or the cap was hit early | Nothing — check the log page's "skipped" count; if it's high, tell the cloud session |
| `auto_post` item stuck in "approved" without moving to "posted" | The channel's poster errored | Copy the text and post/publish manually; mark it accordingly; tell the cloud session which channel |
| A draft cites a figure you can't find at the source link | Sourcing failed | Reject; report it — this is the one failure that must never reach a post |
| Two near-identical drafts for different threads | Dedup missed | Approve/post one, reject the other, report it |

---

## What Claude Code corrected against the live UI (Sep 14, 2026)

The draft delivered from Drive got several real things wrong about the live product — corrected in this version, not just cosmetically:

1. **The admin account really is `admin@casewhy.com`** (the draft had this right) — confirmed directly against the live `ADMIN_EMAIL` value the app actually checks, not assumed from a local `.env.local` file that turned out to be stale (it still said `info@casewhy.com`, the value from before round 85 changed it).
2. **There is no filter control on `/admin/marketing`.** The page is hard-scoped to Pending + Escalated in the query itself — "filter to Pending" isn't a step, it's just how the page always looks.
3. **Card field order was wrong.** Real order is Destination → Guardrail notes → Sources → Draft text, not Destination → Draft → Sources → Guardrail notes.
4. **The "five decisions" (Approve / Edit then approve / Reject / Leave it / Mark posted) don't match the real buttons.** There's no standalone Approve or Edit button on `manual_post` cards — you edit directly in the draft box, then click **Mark posted (as-is)** or **Mark posted (edited)**. `auto_post` cards (only Blog has a real poster right now) show **Approve (queue for auto-post)** instead.
5. **Escalated items resolve with one button, "Acknowledge / dismiss," not "Handled" or "Left."**
6. **Skipped items never appear on the queue page** — only in the log's per-channel counts. The original draft said they'd show in the list.
7. **`/admin/community-replies` is gone entirely (404), not redirecting.**
8. **Round 93 had already shipped by the time this manual was written** — `/admin/marketing/attribution` and the Blog channel are both live, not "(coming — round 93)." Updated both sections.
9. **The alias approval queue's real path is `/admin/inbox`** — the original draft left it unspecified.
10. **The subreddit-list/daily-cap shot (#7 in the original shot list) doesn't exist as a page.** No admin UI was ever built for `community_source_configs` or the cap constant — noted plainly in Section 8 instead of screenshotting something that isn't there.

Two small real bugs were found and fixed in the app itself while doing this verification, not just written around: the log page's per-channel table was missing a "Skipped" column (so channel totals silently didn't match the visible columns), and the channel-label map was missing entries for "Outreach" and "Blog" (falling back to the raw enum string). Both fixed, deployed, and confirmed live before the screenshots below were taken.

---

## Screenshots
