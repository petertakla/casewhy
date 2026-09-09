# New task for Claude Code — round 43: build + seed entity types 4 & 5 — DSOs and community/cultural organizations

**Status: authorized now.** Both entity types are currently "Coming soon" placeholders (round 38's `casewhy.com` section, round 31's `/get-help` hub cards). This authorizes real self-sourced builds for both, following the same "research the source first, build the pipeline once, verify carefully, migrate + seed against production in the same round" discipline as rounds 29/32/34/40.

## Why these sources, and why the two entity types need different shapes — read before starting

Researched first (cloud session, Sep 9), written up in full in `dso-community-org-self-sourcing-research-sep9.md` (this repo, mirrored from the Ideas project) — read that doc for the complete reasoning, this is the short version. Unlike attorneys (round 40) and the DOJ-sourced types, **neither source here includes reliable contact info**, so both entity types ship as a different kind of listing than the existing four.

### Entity type 4 — University international student offices (DSOs)

- **Source: DHS's own "Study in the States" School Search** (`https://studyinthestates.dhs.gov/school-search`) — the government's public tool for exactly this, separate from ICE/SEVP's program-management side (which has no public database at all). Returns, per SEVP-certified school: school name, campus name, physical address, F-1/M-1 certification status.
- **It does not include a Designated School Official's name, phone, or email** — confirmed no bulk source anywhere has this; DSO is a staff role that turns over, with no federal registry of who currently holds it.
- **Build decision: a verified school directory that links out, not a contact directory.** Seed with school name + address + SEVP status (sourced from DHS, cited same as every other entity type), and instead of a phone/email field, link each entry to that school's own general international-student-office page. Do not fabricate, guess, or scrape a second site to find a phone/email/office-page URL that isn't in DHS's own data — if the office-page URL can't be confirmed from an official/primary source (the school's own site, reachable from the school's own top-level domain), leave it as a "visit [School Name]'s website" link to the school's main domain rather than guessing a specific sub-path.
- **Self-enrollment (`/dso/join`) is the path to a named contact.** Schools (or their DSOs directly) can submit a real, current contact — same admin-notification pattern as every other `/<type>/join` form. This is how the record gets more useful over time without CaseWhy hosting unverifiable contact data.

### Entity type 5 — Community & cultural organizations

- **Source: USCIS's own Citizenship and Integration Grant Program (CIGP) recipient lists.** Published per fiscal year on USCIS's site — organizations that won a federal grant specifically for immigrant integration/naturalization work. ~40-66 orgs/year recently, 644 grants total since 2009, 41 states + DC. Same category of source as every other entity type (an official federal record), not a scrape.
- **Real limits to build around, not skip past:**
  - **Partial coverage** — only grant winners, not all community/cultural organizations. Same shape of limitation already accepted for attorneys' board-certification lists (small, credentialed, not exhaustive). State this plainly in the listing's source citation, same as everywhere else.
  - **Direct fetch of the recipient PDFs returned a 403** in the Sep 9 research pass (same USCIS bot-blocking pattern already handled elsewhere in this project, e.g. processing-times/visa-bulletin). Needs a real download-and-parse approach (browser-rendered fetch or an approach that works around the block, then `pdfplumber`-style parsing) — not a simple unauthenticated fetch.
  - **Address/contact fields are unconfirmed** — the public summary page only confirms org name + award amount. Before seeding, actually open a parsed PDF and check what fields it really contains. If it has no address or contact field at all, this becomes the same "link out, don't fabricate contact info" shape as DSOs — seed name + state/region if available, and if no organization website is stated in the source, don't guess one; leave it self-enrollment-only for that entry until it's confirmed some other way.
  - **Multiple fiscal years likely repeat grantees** — if pulling more than one year's PDF for a bigger baseline, dedupe by organization name (and address if present) rather than concatenating years as separate rows.

### Ruled out for this round — do not reach for these as shortcuts

- **211.org's National Data Platform** — real, comprehensive, but requires a paid data-sharing agreement (a 5%-of-revenue fee on commercial use). Not a free bulk source. Out of scope; a future partnership question for Peter, not something to build against now.
- **Welcoming America's Welcoming Network directory** — real public list, but name + location only, no contact fields, terms of reuse unchecked. Don't scrape it as a seed source. (It's a legitimate future *outreach target list* for a self-enrollment campaign, but that's a separate, later effort — not part of this round.)
- **AILA-style or other private directory scraping** — same reasoning as round 40's attorney sourcing: out of scope, don't reach for it if the official sources are more work than expected.

## Part 1 — the standard entity-type template

Both types need the full standing template, same as every other entity type: table (`dso_directory` + `dso_applications`, `community_org_directory` + `community_org_applications`), public pages (`/dso`, `/community-orgs` — or whatever route naming matches the existing convention, e.g. check how `/accredited-representatives` and `/legal-aid` are named and match it), `/<type>/join` self-enroll forms, per-entry permalinks, the shared `<StateFilter>` component, round 39's exact-wording disclaimer, a `BackLink` preserving filter state, and — per the standing template update from Sep 9 — a `data_source` column (round 42's tagging convention: e.g. `dhs_study_in_the_states`, `uscis_cigp`, `self_enrolled`) and the report-a-listing link/pattern from round 41 if round 41 has shipped by the time this is built (if it hasn't shipped yet, add the `data_source` column anyway so round 42/round 41 don't need a follow-up migration, but the report-link UI itself can wait for round 41).

### Schema note: no forced phone/email field

Unlike attorneys/accredited reps/legal aid orgs, don't require a populated phone or email column for these two types' sourced rows — they'll legitimately be null for DHS/CIGP-sourced entries. Do keep the columns (nullable) so self-enrolled entries can fill them in directly.

## Part 2 — parse + migrate + seed, same round, not deferred

1. **DSOs**: pull DHS's Study in the States school-search data (name, campus, address, F-1/M-1 status). Confirm whether it exposes a bulk export/API or requires paginated scraping of the public tool — check its own terms of use before parsing (not checked in the Sep 9 research pass). Cross-check parsed count against whatever total the tool itself displays.
2. **Community orgs**: solve the 403 (try a browser-rendered fetch first), download each available fiscal year's CIGP recipient PDF, parse with `pdfplumber` (same approach as the DOJ roster pipeline), confirm what fields actually exist before finalizing the schema, dedupe across years if pulling more than one.
3. Parse a clean `state` value onto each record for `<StateFilter>`.
4. Cite source + pull date per entry, worded honestly about partial coverage (e.g. "Source: USCIS Citizenship and Integration Grant Program, FY[year] recipients, pulled [date]. This list reflects organizations that received this specific federal grant, not all community organizations.").
5. Apply migrations, seed both tables against production.
6. Spot-check several seeded permalinks per type, confirming any link-out URLs actually resolve to the right destination and no field shows fabricated/guessed data.

## Verify live

`tsc`/lint clean, production build succeeds, both `/dso` (or matching route name) and `/community-orgs` (or matching route name) live with real seeded entries, state filter + text search working on both, join forms submitting real test entries that land in the DB with a real Postmark send, disclaimer wording intact, source citations visible and accurately worded about partial coverage, `data_source` populated on every row. Report back — including terms-of-use findings for DHS's tool and confirmation of what fields the CIGP PDFs actually contain — and fold into `CLOUD_CLAUDE.md`'s standing status, updating `/get-help` and the `casewhy.com` marketing section's "Coming soon" badges to "Live" for both types once confirmed.
