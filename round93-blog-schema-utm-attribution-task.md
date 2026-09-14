# New task for Claude Code — round 93: `/updates` blog, remaining structured data, UTM attribution dashboard

**Status: authorized Sep 14, 2026.** Scoped against what round 73 (SEO/GEO foundation) and round 84 (internal linking, Search Console hooks) already shipped — this round only covers what's still missing. Independent of rounds 89–92 except the attribution job reads the queue's `posted_url`/`utm_link` fields.

## Already done — do not rebuild

Round 73: `robots.txt` + `sitemap.xml` on both domains, unique metadata on all 27 public pages, FAQPage JSON-LD on `/faq`, `/policy/[id]`, `/processing-times`, `/visa-bulletin`, the `/policy` index, `/faq`, `/sitemap`, Search Console + Bing verified and sitemaps submitted. Round 84: internal linking audit, verification-tag slots. The daily SEO indexing routine already reports on indexing.

## Part A — `/updates` on app.casewhy.com (the editorial blog `/policy` isn't)

`/policy` is the memo library — one page per USCIS policy memo. What's missing is a place for editorial posts (founder story, "what 'Case Was Received' actually means," "when your case goes silent — what's normal") that the email issues (round 92) and social threads (round 90) can link to.

- `/updates` index + `/updates/[slug]`, same list + permalink pattern as `/news` and `/policy`. Content from Markdown files in the repo (`content/updates/*.md`; frontmatter `title`, `date`, `summary`, `pillar`, `sources[]`, `og_image`, `lang`). The cloud session delivers posts as files; no CMS.
- Sourcing block on every post — same two-link pattern as the app's policy citations (official source + "Ask CaseWhy about this →" when a `POLICY_MEMOS` id matches).
- RSS at `/updates/feed.xml`. Add `/updates` to `sitemap.ts`, the `/sitemap` index, and both domains' footers next to FAQ/Policy. Clean top-level path per round 73's merge-proofing table — log it there.
- `es/` variant only if a post ships with `lang: es`; don't machine-translate.
- Seed with the 5 posts the cloud session delivers with this spec (a `claude_updates-seed-posts` doc will follow).

## Part B — structured data round 73 didn't cover

`Article` JSON-LD on `/updates/[slug]`; `Organization` + `WebSite` on `app.casewhy.com/` and `casewhy.com` with `sameAs` for the LinkedIn/X/YouTube profiles (env-driven list so it grows as accounts are created); `BreadcrumbList` on `/policy/[id]` and `/updates/[slug]`. Keep the existing FAQPage markup untouched. Add a CI script that fails the build on JSON-LD parse errors (Rich Results validation stays a manual verify step).

## Part C — UTM + attribution

- `buildUtmLink(url, {source, medium, campaign})` in `src/lib/marketing/utm.ts`; every link the queue (round 89) or the email cron (round 92) emits goes through it: `utm_source=<channel>`, `utm_medium=organic|email|outreach`, `utm_campaign=<pillar|issue-no|sequence>`. Stored on the queue item as `utm_link`.
- First-touch capture: read `utm_*` on landing, persist in a cookie (90 days), attach to the account row at sign-up (`first_touch_source`, `first_touch_campaign`, `first_touch_at`). Purely additive migration.
- `/admin/marketing/attribution`: per source and campaign — landings, sign-ups, tracked cases, Plus conversions (once billing is live). Monday 09:00 ET digest email to `info@casewhy.com` (reuse the alias send path). This is what the cloud session reviews weekly.

## Peter's one-time steps

None.

## Verify live

- `/updates` renders the 5 seed posts, feed validates, sitemap includes them, both footers link to it.
- Rich Results Test passes on one `/updates` post and the home page (Organization).
- A UTM-tagged link followed through to a test sign-up shows the source on the attribution page.
- tsc/lint clean, production build succeeds, deployed. Fold into CLOUD_CLAUDE.md referencing rounds 73, 84, 89.

---

## Claude Code build notes (Sep 14, 2026)

Shipped as described, with two real corrections against the literal spec, both stated rather than silently forced:

1. **"`/updates` renders the 5 seed posts" doesn't hold at ship time, by design.** Posts are gated behind the round 89 `marketing_queue` (`channel=blog`) — a post only goes public once Peter approves it there, per the seed-posts doc's own instruction ("Peter reviews each post once... that is his only step"). All 5 are seeded as `pending`; `/updates` correctly shows "No posts yet" until he approves them. This was intentional, confirmed against the seed-posts doc, not a miss — see CLOUD_CLAUDE.md's round 93 entry for the full reasoning and what was verified live instead.
2. **Organization/WebSite JSON-LD on `app.casewhy.com/` couldn't go there.** That route is a pure 308 redirect to casewhy.com (since round 74) and never renders a body. Placed on `/sitemap` instead — the closest real, always-served, public page — with a comment explaining why.

Full writeup, verification steps, and the sources-block gap found and fixed after initial ship: see CLOUD_CLAUDE.md, "Round 93."
