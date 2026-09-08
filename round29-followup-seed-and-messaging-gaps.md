# New task for Claude Code — round 29 follow-up: the seed data, "free" messaging, and nav-order specs never actually landed

**Status: ready now.** Checked `CLOUD_CLAUDE.md`'s own round 29/31 write-ups against what was actually specified, and found three real gaps — not a rebuild, a completion pass on work that shipped ahead of its own spec updates.

## Gap 1 — round 29 shipped with an empty directory; the real DOJ seed data was never populated

Round 29's done-note says `src/lib/representatives/directory.ts` "ships empty... same hand-curated pattern as `attorneys/directory.ts`." That's the *attorney* pattern (correct there, since attorneys need individual consent/opt-in — see `partner-marketing-domain-concept.md`). But `round29-accredited-reps-build-and-seed-task.md` (already in this repo) specifically calls for accredited representatives to be different: seeded from DOJ EOIR's own public roster, Florida-first, since DOJ itself is the vetting authority and there's no consent gap. That Part 2 (the actual seed) doesn't appear to have run.

**Do this now:** pull `https://www.justice.gov/eoir/page/file/942301/download` and parse it with real code (Python `pdfplumber`/`pypdf` or equivalent — not a summarized fetch, see the original task doc for why that failed when tried from the cloud session), filter to Florida addresses, cross-check the parsed count against the document's own stated total, skip anything already past its accreditation-expiration date, and populate `src/lib/representatives/directory.ts` with the result. Each entry needs its own permalink (`/representatives/<slug-or-id>`) — confirm this exists on the page/routing already built, add it if not.

## Gap 2 — the "free, always" messaging was never added

Checked directly: no occurrence of "free to use," "no fees," or similar language anywhere in the shipped `/get-help`, `/attorneys`, or `/representatives` pages per this file's own build notes. This spec landed in `partner-marketing-domain-concept.md` and `get-help-hub-and-nav-task.md` *after* round 31 had already shipped, so it's not a regression — just unfinished. Add, per those docs: a plain "free to use, always — no fees, no ads, no hidden cost" statement on `/get-help`, `/attorneys`, `/representatives`, and each `/join` page (reassuring the applicant there's no cost), plus a clarifying line on `/plus` that Get Help isn't a Plus perk.

## Gap 3 — two nav-placement corrections, also landed after round 31 shipped

1. In the signed-in app nav (`AuthHeader.tsx`), "Get Help" should sit **immediately after "CaseWhy Plus"** in the nav order — confirm current position and fix if it's elsewhere.
2. **Signed-out visitors on `app.casewhy.com` need "Get Help" in the top nav too**, not just the landing-page footer — additive to the footer link, not a replacement. Check whatever renders as the header in the signed-out state and add it there if missing.

## Not in scope here

Legal aid orgs / DSOs / community orgs / employers (entity types 3-6) — still unauthorized, unrelated to this cleanup pass.

## Verify live

Same bar as every other round: `tsc`/lint clean, production build succeeds, and each of the three gaps above actually confirmed live in a real browser (not just "should work") before marking done.
