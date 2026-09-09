# New task for Claude Code — round 40: seed `/attorneys` with real, board-certified immigration attorneys (FL, TX, NC)

**Status: authorized now.** `/attorneys` (round 27/28) has the standard template built — table, public page, join page, permalinks, `<StateFilter>`, the round-39 disclaimer wording — but is empty of real listings. This seeds it, the same "build the pipeline once, verify carefully, migrate + seed against production in the same round" discipline as round 32/34/35.

## Why this source, and why not others — read before starting

Researched first (cloud session, Sep 9), written up in full in `attorney-directory-self-sourcing-research-sep9.md` (this repo, mirrored from the Ideas project) — read that doc for the complete reasoning, this is the short version:

- **There is no attorney equivalent of the DOJ EOIR roster.** Confirmed against EOIR's own policy manual: any attorney licensed and in good standing in any state is automatically authorized before immigration court, with no separate accreditation step and no resulting public federal roster. That shortcut is unique to accredited representatives (rounds 29/32/35) and doesn't exist for attorneys generally.
- **The source for this round: official state-bar board certification in immigration law**, specifically because it's the closest analog to the DOJ roster (a government-recognized regulatory body's own public record, not a scrape of a private company's product) and because "board-certified specialist" is a real, verifiable credential rather than a self-tagged practice area. Three states run this certification: **Florida** (The Florida Bar, "Board Certified in Immigration and Nationality Law"), **Texas** (Texas Board of Legal Specialization, "Immigration and Nationality Law"), and **North Carolina** (NC State Bar Board of Legal Specialization, "Immigration Law"). This is a small list — Florida's alone is 74 attorneys — not a bulk nationwide pull like the DOJ roster's 2,500+. That's expected and fine; self-enrollment (already built, `/attorneys/join`) is the long-run path for volume everywhere else.
- **Do not scrape AILA's directory, Avvo, Martindale-Hubbell, FindLaw, or Justia.** Those are private companies' proprietary, curated directory products, not official records — scraping and republishing that data as a competing directory is a materially different and riskier act than pulling from a state bar's own certification records. Out of scope for this round, and shouldn't be reached for as a shortcut if the state-bar sources turn out to be more work than expected.

## Sources — check each state's terms before parsing it, not just Florida's

- **Florida**: `https://www.floridabar.org/about/cert/cert-im-mbrs/` — public, searchable, paginated (74 results as of Sep 9 research). Fields observed: name, bar number, firm name/address, office phone, cell phone, fax, email, photo where available. The Florida Bar's general site Terms of Use (`floridabar.org/home/terms-of-use/`) has no explicit prohibition on bulk/commercial use of directory data as of the Sep 9 research check — re-verify this is still true before building, terms pages change.
- **Texas**: Texas Board of Legal Specialization's own certified-specialist search (find the current URL — TBLS runs its own lookup separate from the general State Bar of Texas directory). **Check TBLS's terms of use before parsing** — this was not checked in the Sep 9 research pass, only Florida's was.
- **North Carolina**: NC State Bar Board of Legal Specialization's own specialist listing (again, find the current dedicated URL, likely under `nclawspecialists.gov` or `ncbar.gov` — both appeared in research, confirm which one is the actual authoritative live listing). **Check its terms of use too**, same reason.

If any of the three states' terms of use turns out to actually prohibit this kind of use (unlike what the Sep 9 spot-check found for Florida), stop for that state specifically, seed the other one/two, and flag it back rather than guessing or proceeding anyway.

## Part 1 — the standard entity-type template (mostly already built)

`/attorneys`, `attorney_directory` (or whatever the existing table is called), `/attorneys/join`, and per-entry permalinks already exist from round 27/28 — confirm the schema fits this data (state as its own filterable column, per the standing convention) rather than rebuilding. Add whatever's missing to match the current standard other entity types have (round 39's disclaimer wording is already live here per `CLOUD_CLAUDE.md`'s Round 39 done-note — confirm it's intact, don't duplicate it).

### New field this round: website URL, best-effort

**Peter's ask: include a hyperlink to each attorney's own website where possible.** None of the three source directories were confirmed to include a website field in the Sep 9 research pass (Florida's listing showed name, bar number, firm, address, phone, fax, email, and photo — no website column was noted). So:

1. **Check first** — when actually parsing each state's page/data, look for a website/URL field that wasn't visible in the initial research pass. If it's there, include it.
2. **If the source doesn't provide it directly, do not guess, construct, or scrape a second site to find it.** No fabricating a URL from the firm name, no auto-generating a "probably their site" guess, and no scraping a *third* site (Google, the firm's likely domain, etc.) to backfill it — that reintroduces exactly the kind of unverified-data risk this whole sourcing approach was chosen to avoid. Leave the field null for that entry if the source doesn't state it.
3. **Add a `website_url` column to the schema either way** (nullable) — even if it comes back mostly empty from these three official sources, it's there for self-enrollment submissions (`/attorneys/join` can ask for it directly, since the attorney submitting their own listing obviously knows their own site) and for any future source that does include it.
4. **On `/attorneys` and each permalink page, render it as a real clickable hyperlink when present** (`<a href="...">`, opening in a new tab, `rel="noopener noreferrer"`), simply omitted (not a broken/empty link) when the field is null.

## Part 2 — parse + migrate + seed, same round, not deferred

Same lesson as round 29→32 and restated in round 34: the seed step ships in this same round, migrated against production and verified with a real query, or the round isn't done.

1. Parse each state's certified-specialist listing (name, bar number, firm, address, state, phone, email, website if present). Handle pagination (Florida's is paginated — 74 results across multiple pages of 10/25/50).
2. Parse a clean `state` value onto each record for the shared `<StateFilter>` dropdown (all three states will actually be represented this time, unlike round 29's Florida-only start).
3. Cross-check the parsed count against each state's own displayed total (e.g., Florida's "74 results" figure) — if the parser returns a different count, that's a bug to find before seeding, not something to seed anyway and fix later.
4. Cite source + pull date per state on each listing ("Source: The Florida Bar, Immigration & Nationality Law certification directory, pulled [date]" — same pattern as the DOJ-sourced entity types).
5. Apply the migration and seed the table against production.
6. Confirm each seeded entry renders at its own `/attorneys/<slug-or-id>` permalink, with the website link (where present) rendering correctly and pointing to the right destination — spot-check a few, don't just trust the parse.

## Verify live

`tsc`/lint clean, production build succeeds, `/attorneys` and at least one real seeded permalink confirmed live per state (all three states represented, not just Florida), state dropdown + text search both working, website hyperlink confirmed rendering correctly where the source data had one and cleanly omitted where it didn't, source citation + pull date visible, round 39's disclaimer wording confirmed still intact and unchanged. Report back — including the terms-of-use check results for Texas and North Carolina specifically, since those weren't checked in the Sep 9 research pass — and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
