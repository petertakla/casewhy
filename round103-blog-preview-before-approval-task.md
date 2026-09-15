# New task for Claude Code — round 103: read a blog post before approving it (admin preview of unpublished /updates posts, a Blog-specific queue card, and a standing rule: what Peter approves is what Peter sees)

Status: authorized now, Sep 15 (Peter's direct report: the five Blog cards in the queue are "a one liner with not much meat" — he was shown the title + summary and asked to approve 500–700-word articles he couldn't read). Revised same day to add the Section 4 standing rule. Numbering: 101 done, 102 in Drive; per round 95 confirm 103 is free against CLOUD_CLAUDE.md and the tracker before building.

## What's live today (read from the repo, Sep 15)

- MarketingQueueCard.tsx renders every channel the same way: guardrail notes, "Grounded in", an editable textarea of draftText, and for auto_post channels with a registered poster an **Approve (queue for auto-post)** button. For Blog rows, draftText is only the post's title + one-sentence summary (~35 words), set by scripts/seed-updates-marketing-queue.ts. The real article is content/updates/<slug>.md (500–700 words each, five files).
- Editing the Blog card's textarea changes the queue row's draftText, not the post — misleading, since the card says "edit before marking posted".
- The card's destination link (/updates/<slug>) opens in a new tab and 404s, because getPublishedUpdateBySlug() returns null until the row is posted/edited_posted (round 93's gate, correct for the public).
- Net effect: the reviewer cannot read what they're approving from inside the app.

## What to build

### 1. Admin preview of an unpublished post — /updates/<slug>?preview=1

- src/lib/updates/updates.ts: add getUpdateBySlugFromDisk(slug) (server-only; reads the file regardless of the queue gate). Do **not** change getPublishedUpdateBySlug or getPublishedUpdates — the public gate stays exactly as round 93 built it.
- src/app/updates/[slug]/page.tsx: if getPublishedUpdateBySlug returns null **and** searchParams.preview === "1" **and** the current session passes the same isAdminEmail check src/app/admin/layout.tsx uses (server-side, same helper — don't duplicate the email check), render the post from getUpdateBySlugFromDisk. Otherwise notFound() as today. Both conditions required: without ?preview=1 an admin sees the same 404 the public sees, so the admin can also verify what the public sees.
- Preview render differences, all deliberate: a banner at the top — **"Preview — not published. Approve it in Admin › Marketing to make it public."** (Spanish: "Vista previa — no publicado. Apruébelo en Administración › Marketing para hacerlo público.") with a link back to /admin/marketing?channel=blog; robots: noindex, nofollow in metadata; **no** Article/BreadcrumbList JSON-LD; **no** ShareButton; canonical omitted. Everything else (typography, sourcing block, BackLink) identical to the published render so what Peter reads is what readers will get.
- generateMetadata follows the same rule (title from the disk post in preview, "Update not found" otherwise).
- Optional, only if it's a few lines: /updates?preview=1 for an admin lists every post on disk with a **Published / Not published** chip per row, each linking to its ?preview=1 permalink. Skip if it complicates the list page.

### 2. A Blog-specific queue card

In MarketingQueueCard.tsx, branch on channel === "blog" (keep every other channel's render byte-identical — round 98 left this component untouched on purpose and the manual's screenshots depend on it):

- No textarea. Show the post **title** (first line of draftText) as a heading and the **summary** (the rest) as a paragraph, read-only.
- Replace the raw destination link with a prominent **Preview post ↗** link to /updates/<slug>?preview=1 (target="_blank"), labelled so it's obviously the thing to click before approving. Keep the slug visible in small mono text.
- Keep guardrail notes and "Grounded in" as they are.
- Buttons: **Publish to /updates** (calls the existing approveForAutoPost(id, draftText, channel) unchanged — pass draftText as-is, since there's nothing to edit) and **Reject**. Done state reads "Blog — published" instead of "marked posted".
- Update the one line of help text at the top of /admin/marketing if it still says owned channels "can auto-post once a future round wires up that platform's API" — Blog has had a real poster since round 93.

### 3. Manual and docs

- MARKETING_OPERATIONS_MANUAL.md: in the Blog channel section, replace the approval steps with: open the card → **Preview post** → read → back to the queue → **Publish to /updates** or **Reject**. Note that the post text itself is edited in the repo (content/updates/<slug>.md, Code commits), not in the card. Take one new screenshot of a Blog card and one of the preview banner; the cloud session will fold the rest of the rounds 101/102 manual updates in afterwards.
- CLOUD_CLAUDE.md: fold in, referencing rounds 89, 93, 98, and add the Section 4 standing rule; mirror it into the tracker's standing-rule list.

### 4. Standing rule — add to CLOUD_CLAUDE.md next to rounds 88, 95, 98, 99, 101

**What Peter approves is what Peter sees.** Every marketing-queue card shows the *complete* artifact exactly as it will go out, never a title, summary, first line, or filename: the full text of a reply or post; every post of a thread, in order; an email as subject + preview text + the rendered body (HTML, not raw Markdown) with the footer/unsubscribe block; an image at its posted size; a video playable inline with its caption; and, when the artifact is a page (blog post, landing page), a **Preview** link that renders it as the public will see it. A queue item whose card doesn't show the whole thing is not done. This applies to rounds 90 (X threads, Threads posts), 91 (pins, graphics, videos), 92 (nurture issues), and 94 (outreach sequence emails) when they are built — each of those task docs is to be read with this rule on top.

## Out of scope

Editing post bodies from the admin (a DB-backed editor is a separate, later decision). Any change to the public /updates list, RSS, sitemap, or JSON-LD on published posts. Other channels' cards.

## Verify live

- Signed out: /updates/a-note-from-the-founder → 404; with ?preview=1 → still 404. Signed in as a non-admin test account: same two 404s.
- Signed in as admin@casewhy.com: /updates/a-note-from-the-founder → 404; ?preview=1 → the full post with the preview banner; curl -I (with the admin cookie) shows the noindex header/meta; page source has no application/ld+json and no share button.
- /admin/marketing?channel=blog: five Blog cards show title + summary read-only, a Preview post link that opens the preview, and Publish / Reject buttons; a Reddit fixture card (insert, screenshot, delete — same as round 98) still renders the textarea and the old buttons unchanged.
- Publish one post as a real test only if Peter says so in chat (he plans to read all five first). Otherwise leave all five pending.
- After a publish: the public permalink renders without the banner, with JSON-LD and share button; ?preview=1 on a published slug just renders the normal page (no banner).
- tsc/lint/build clean, deployed; tracker last line → "104+ unclaimed".

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described. One real bug found and fixed along the way, not in the task doc: every `content/updates/*.md` file's unquoted `date: 2026-09-15` frontmatter gets parsed by gray-matter/js-yaml as a native JS `Date` object, not the plain string `UpdatePost.date`'s own doc comment assumes — `String(aDateObject)` produced `"Invalid Date"` everywhere the date was rendered (permalink page, RSS feed). Never caught before because none of the five seed posts had ever had their permalink page actually rendered — all five have sat unapproved since round 93, so this round's admin preview route was the first real reader. Fixed at the read source (`readAllPostsFromDisk`), not patched per-consumer.

A live check briefly showed the old (pre-round-103) card layout on `/admin/marketing?channel=blog` right after deploy — traced to a stale service-worker/Cache Storage entry from an earlier visit in the same browser tab, not a real deployment or code problem; confirmed by unregistering the service worker and clearing caches, then reloading clean, which showed the correct new layout immediately. `curl` against the production domain returned 403 site-wide during verification (a Vercel bot-protection checkpoint, confirmed unrelated to this round by checking it also blocked known-good, unrelated pages) — signed-out behavior was verified against a local dev server pointed at the same production database instead, and signed-in behavior was verified live in a real browser via an already-authenticated admin session (no credentials entered).

The optional `/updates?preview=1` admin list view was skipped, per the task doc's own explicit allowance — the queue card's own Preview link covers the real workflow.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 103" and its standing rule.
