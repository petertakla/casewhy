# New task for Claude Code — round 108 (hotfix, ship today): a blog post's date is the date it was published, not the frontmatter date

Status: authorized now, Sep 15. Live bug: Peter published all five seed posts today and /updates shows four of them dated in the future (Sep 16, 18, 23, 25). Cause: the cloud session's seed doc gave each post a staggered date as a suggested cadence, and round 93 renders that field literally. Numbering: 101–103 done; 104–107 in Drive; per round 95 confirm 108 is free against CLOUD_CLAUDE.md and the tracker before building. Build this before 104–107 — it's small and it's visible to the public now.

## What to build

### 1. Published date comes from the Publish click

- The round-89 marketing_queue row is already the source of truth for whether a post is public. Make it the source of truth for when: ensure the row has a posted_at timestamp set by approveForAutoPost / the blog poster at the moment of approval (add the column if it doesn't exist; backfill from updated_at for the five rows posted today).
- In src/lib/updates/updates.ts, the merge that already joins posts to queue rows (approvedSlugSet) returns publishedAt alongside the slug. UpdatePost gains publishedAt: string (YYYY-MM-DD, America/New_York, matching the round-100 precedent of using Eastern dates for user-facing dates) and keeps date as authoredAt for reference only.
- Every consumer switches to publishedAt: the list page's date and sort order (newest published first), the permalink header, Article.datePublished / dateModified, RSS <pubDate>, sitemap.ts's lastmod. The round-103 preview (unpublished) shows "Not yet published" where the date would be, not the frontmatter date. grep afterwards: nothing user-facing renders post.date.
- Frontmatter date stays in the files (round 107's editor won't touch it) but is documented in updates.ts as "authored date; not displayed." Update the five seed files' date to 2026-09-15 anyway so the repo doesn't carry misleading values.

### 2. Guard against the same mistake in the other direction

- A post whose queue row is posted always displays; nothing in the code should hide or delay a post based on any date. Scheduled publishing is not a feature — if it ever becomes one it's a separate round with an explicit publish_after field, not a reuse of date.

### 3. Docs

- CLOUD_CLAUDE.md: fold in under round 93's entry, and add one line to the /updates section of MARKETING_OPERATIONS_MANUAL.md: "A post's date is the day it was published from the queue."
- The cloud session fixes its own seed-posts doc (dates → Sep 15, with a note that date is not the publish date).

## Verify live

- /updates: all five posts dated Sep 15, 2026, order by published time (the founder note first if it was approved first — check posted_at).
- One permalink: header date Sep 15; Article.datePublished = 2026-09-15; RSS <pubDate> for every item = Sep 15 (validate the feed).
- sitemap.xml lastmod for the five URLs = 2026-09-15.
- Round-103 preview of a fresh unpublished test file (add one on a branch, don't commit): shows "Not yet published", no date.
- tsc/lint/build clean, deployed; tracker last line → "109+ unclaimed".

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described. One real correction to the task doc's own framing: `marketing_queue.posted_at` already existed as a column (added well before this round) and was already being set correctly by `approveForAutoPost`/`markPosted` at the exact moment a post is published — confirmed via a direct DB query showing all five blog rows' real `posted_at` timestamps, seconds apart, from when Peter clicked Publish on each. No schema migration and no backfill were actually needed; the task doc's "add the column if it doesn't exist" framing didn't match the current state of the schema, caught by checking before building rather than assuming.

`UpdatePost.date` split into `authoredAt` (frontmatter, unused for display) and `publishedAt: string | null` (derived from the queue row's real `postedAt`, formatted `YYYY-MM-DD` in `America/New_York`). Sorting on the list page switched from comparing `publishedAt` date strings (which would tie for all five posts, published within ~20 seconds of each other today) to comparing the real underlying `postedAt` timestamps directly, so publish order is actually preserved rather than left arbitrary among same-day posts.

`sitemap.ts` previously gave every single URL in the whole sitemap the same blanket `lastModified: new Date()` — there was no per-post `lastmod` logic to "switch" at all. Built it fresh for the five `/updates/*` entries (their own real `publishedAt`), left every other path on the existing blanket value, since giving policy memos/entity pages/static pages their own real "last changed" date was out of this round's scope.

Verified live against the five real, already-published posts (not a test fixture) for everything reachable that way: `/updates` list order and dates, a permalink's JSON-LD and header, the RSS feed's five `<pubDate>` values, and `sitemap.xml`'s five `lastmod` values, plus the Spanish date format on `/updates?lang=es`. The "Not yet published" preview state (task doc: "add one on a branch, don't commit") was verified via a direct import test against a real, uncommitted, immediately-deleted test file instead of an actual throwaway deploy cycle — confirmed `getUpdateBySlugFromDisk` returns `publishedAt: null` for an unpublished post, which is exactly the condition the page component's "Not yet published" branch checks.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, under the Round 93 entry (as instructed).
