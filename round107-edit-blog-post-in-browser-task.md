# New task for Claude Code — round 107: edit a blog post in the browser before (or after) publishing — an admin Markdown editor with live preview, DB overrides over the repo file, and an admin Updates page

**Status: authorized now, Sep 15 (Peter: "how can I edit a post before pushing to Publish" — today the only path is Code editing** **content/updates/\<slug\>.md** **and deploying). Builds on round 103 (done Sep 15). Numbering: 101–103 done; 104–106 in Drive; per round 95 confirm 107 is free against** **CLOUD_CLAUDE.md** **and the tracker before building.**

## Design in one paragraph

The repo file stays the seed; an updates_overrides row, keyed by slug, wins over it at read time. Admin edits the override in a plain Markdown textarea with a live rendered preview next to it, saves without a deploy, and publishes from the queue as in round 103. Sources stay structured fields (title + URL), not prose, so the guardrails' "every claim cites its source" rule can't be edited away by accident. No rich-text editor — Markdown only, deliberately.

## What to build

### 1. Schema — updates_overrides

slug (PK, must match a file on disk), title, summary, body_md, sources (JSON array of {title, url}), og_image (nullable), updated_at, updated_by (admin email). One row per slug, upserted. Migration in the usual pattern.

### 2. Read path — one merge point

In src/lib/updates/updates.ts, readAllPostsFromDisk() stays as is; add applyOverrides(posts) that fetches all override rows in one query and replaces the overridden fields. Every reader — getPublishedUpdates, getPublishedUpdateBySlug, getUpdateBySlugFromDisk (round 103's preview), the RSS feed, the JSON-LD builders, sitemap.ts — goes through the merged result. grep afterwards: nothing reads readAllPostsFromDisk directly except the merge helper. lang and date remain file-only (date is the publication date; the round-103 normalizeFrontmatterDate fix stays in place).

### 3. /admin/updates — the list page (registry entry, round 98 rule)

New admin nav entry, new group Content (after Marketing): /admin/updates — label Updates, Actualizaciones, description "Every blog post on disk: published or not, edited or not, with preview and edit links." Table: title · slug · date · status chip (Published / Pending from the round-89 queue row; Rejected if so) · Edited chip when an override exists · Preview ↗ (the round-103 ?preview=1 URL, or the public URL when published) · Edit. This also delivers the optional list view round 103 skipped.

### 4. /admin/updates/[slug]/edit — the editor

- Same admin gate as the rest of /admin/*; breadcrumb Dashboard › Admin › Content › Updates › Edit:.
- Left: fields for Title, Summary (one sentence, the seed's second line), Sources (repeatable title + URL rows, add/remove; at least one required), and a Body (Markdown) textarea sized for a 700-word post. Right (stacked below on phones): a live preview rendered with the same react-markdown setup the permalink page uses, so what's previewed is what publishes. A short Markdown crib line under the textarea (## heading, **bold**, [text](url)).
- Buttons: Save (upsert the override; stays on the page, shows "Saved — "), Preview full page ↗ (opens the round-103 preview in a new tab), Revert to repo file (deletes the override after a confirm — never a browser confirm() dialog; an inline two-step button), and Back to Updates.
- Validation, server-side in the action: title/summary/body non-empty; every source has a non-empty title and an https:// URL; body ≤ 50 KB. Reject with a readable message; never save a partial.
- If the post is already Published, show a one-line amber note above Save: "This post is live — saving publishes the edit immediately." Editing after publish is allowed on purpose (typo fixes).
- Round 103's Blog queue card: read the title/summary from the merged post, not the seed draftText, and add an Edit link next to Preview post, so the card, the preview and the editor never disagree.

### 5. Guardrails

The editor doesn't run the AI guardrail check (that ran at drafting time and the human is the reviewer here), but it does keep the structural ones: sources required, no empty body, and the standard UPL footer line on the permalink page stays rendered from the template, not from the editable body.

## Out of scope

Creating a new post from the admin (a post still starts as a repo file so it exists in git — a later round if the cadence justifies it). Rich-text editing. Image upload (og_image stays a URL). Editing lang/date. Any change to the public list page beyond reading merged data.

## Verify live

- Edit a-note-from-the-founder in the editor (change one sentence), Save → the ?preview=1 page shows the change; the repo file is unchanged (git status clean); the Blog card's summary updates if the summary was edited.
- Sources: remove all → Save rejected with the message; add one with http:// → rejected; valid → saved.
- Revert to repo file → preview shows the original text; the Edited chip disappears on /admin/updates.
- /admin/updates lists all five posts with correct status chips; sidebar shows the new Content › Updates entry; breadcrumb resolves on the edit page; /admin index shows the card.
- Publish one post only if Peter says so in chat; if he does, confirm the public permalink, RSS <item> and Article JSON-LD all carry the edited title/summary/body, and that a post-publish edit + Save changes the public page without a deploy.
- Non-admin session: /admin/updates and the edit page redirect exactly like every other /admin/* route.
- tsc/lint/build clean, deployed; MARKETING_OPERATIONS_MANUAL.md Blog section updated (edit step added, one screenshot of the editor); tracker last line → "108+ unclaimed".

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described, with one interpretation call: the task doc says `sources (JSON array of {title, url})`, which read literally could mean a native postgres jsonb column. This codebase has an established, explicitly-documented convention against that (`marketingQueue.sourceCitations`'s own comment: "this codebase's established convention is plain text columns, not postgres arrays/jsonb ... rather than introducing a new column-type pattern for one table"). Followed that precedent: `sources_json` is a `text` column holding `JSON.stringify(sources)`, which is still genuinely a JSON array — just stored as text, consistent with every other list-shaped field in this schema.

Two real bugs found during live verification, not in the task doc, both fixed same-round:

1. **Revert to repo file** deleted the DB row correctly every time (verified via direct DB queries), but the client-side form kept showing the just-deleted content until a manual page reload — `handleRevert()` was resetting local state to `initialTitle`/etc, which reflected whatever was live when the page first mounted (the override, if one already existed), not the true repo file. Fixed by reloading the page after a successful revert instead of resetting client state by hand.
2. **Validation error messages never reached the browser in production.** Next.js redacts a Server Action's thrown `Error` message from the client by default in production builds — confirmed via Vercel's function logs, which showed the intended "Every source URL must start with https://." error firing exactly as designed, server-side, while the browser only ever saw a generic "An error occurred in the Server Components render" message. `saveOverride` was changed to return `{ ok: true } | { ok: false; error: string }` instead of throwing on validation failure, so the message survives the trip back to the client. This would not have been caught by local `npm run dev` testing alone, since dev mode does not redact these messages — only a real production deploy exposed it.

Verify-live was done against the real, live production posts (all five round-93 seed posts, all still genuinely unpublished) — every test override created during verification was cleaned up via direct DB deletes afterward, confirmed via a final query returning zero rows. No post was published during this round (not requested in chat).

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 107."
