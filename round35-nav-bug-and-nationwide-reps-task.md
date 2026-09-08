# New task for Claude Code — round 35: fix the signed-out nav bug, expand accredited representatives nationwide

**Status: authorized now.** Two independent items from Peter, both found live on the deployed app — not planning-doc speculation. Fix Part 1 first (it's a real bug on live traffic); Part 2 can follow in the same session.

## Part 1 — bug: signed-out visitors see the full app nav, not just "Get Help | Sign in"

Peter reports (Sep 8, testing the live site) that `app.casewhy.com`'s header shows the **full signed-in-style menu** to a signed-out visitor, not the minimal "Get Help | Sign in" pair round 33 was supposed to ship.

**This contradicts round 33's own done-note**, which states: *"Signed-out visitors on `app.casewhy.com`'s landing page (`/`) had no header nav at all... Added a 'Get Help' link next to 'Sign in' in that branch, gated to `!onAppPage` so it doesn't duplicate the nav's own 'Get Help' link on pages that already show the full nav."* Round 33 also flagged its own verification as incomplete — no browser-automation tool was available that session, so this was verified by reading the logic rather than a real click-through, and explicitly asked for a person or a future session with browser tools to confirm visually. This is that confirmation, and it found a real problem.

**Investigate rather than re-guess the fix:**
1. Reproduce directly — load `app.casewhy.com` signed out (private/incognito window or a real signed-out session) and check what actually renders in the header.
2. Look at `AuthHeader.tsx`'s `onAppPage` computation and the two render branches round 33 describes. A likely cause: `onAppPage` (or whatever decides "is this an app route") is evaluating incorrectly for the specific page Peter was on — e.g. it's true when it should be false, so the signed-out visitor falls into the full-nav branch meant for signed-in/app-route users. Confirm which page(s) this happens on (just `/`, or others too) rather than assuming it's isolated to the landing page.
3. Fix so a signed-out visitor sees only "Get Help | Sign in" — never the full `NAV_LINKS` set (Dashboard, Ask a question, CaseWhy Plus, Processing times, Visa bulletin, News, Settings) — on any page where they're not signed in.
4. This time, verify with an actual browser (Claude in Chrome or equivalent) if available this session — a real signed-out click-through, not just a logic read — since that's exactly the gap that let this ship broken last time. If no browser tool is available again, say so explicitly and ask for a human check the same way round 33 did, rather than silently repeating the same lighter-touch verification a second time.

## Part 2 — accredited representatives: expand from Florida-only to all states, with a state-selector dropdown

`/accredited-representatives` currently only has Florida entries (98 records, seeded in round 32 from DOJ EOIR's roster, Florida-filtered by design as the "go local first" starting point). Peter wants full national coverage now, with the user picking their state.

1. **Re-run the seed against the same source, without the Florida filter.** Source is the same DOJ EOIR roster already in use (`https://www.justice.gov/eoir/page/file/942301/download`), same parsing pipeline as round 32 (`scripts/seed-accredited-representatives.ts` — extend it, don't fork a new script), same discipline: real PDF-parsing code, not a summarized fetch. Parse and include **every U.S. state plus DC** (and Puerto Rico/territories if the roster includes them — check rather than assume), not just Florida. Keep the existing skip-lapsed-entries and source-citation logic as-is; this is a scope change on geography, not a rework of the parsing/vetting logic itself.
2. **Add a `state` column to `accredited_representative_directory`** if one doesn't already exist in a usable form (the address field may already contain it as text — check whether it needs to be parsed out into its own column for filtering, since a dropdown needs a clean value to match against, not a substring search on a full address).
3. **Add a state-selector dropdown to `/accredited-representatives`** — standard US state list (+ DC), filters the listed entries to the selected state. Default to showing **all states** with no filter applied (not defaulting to Florida) — Peter didn't ask for a Florida-first default here, just full coverage with the user able to narrow it down.
4. **Keep individual permalinks working** (`/accredited-representatives/[slug]`) — check that slugs stay unique now that the same organization name pattern could repeat across states (e.g. two orgs with a similar name in different states); if the current slug scheme could collide, make it state-aware or id-based rather than assuming name-based slugs stay unique at 50-state scale.
5. **Cross-check the parsed national count** the same way round 32 cross-checked Florida — spot-check a handful of non-Florida entries against the source document directly, not just trust a bigger parse to have worked because the smaller one did.
6. Update the page copy/count references that currently imply Florida-only coverage (if any) to reflect national coverage.

## Verify live

Part 1: confirmed on a real signed-out browser session — header shows only "Get Help | Sign in," on every page type, not just `/`. Part 2: confirmed the state dropdown actually filters, a sample of non-Florida entries render correctly with working permalinks, and the total seeded count is sane against the source document. `tsc`/lint clean, production build succeeds, both parts deployed and confirmed live. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
