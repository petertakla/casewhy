# New task for Claude Code — round 34: legal aid / nonprofit immigration orgs, build + seed

**Status: authorized now.** Peter greenlit this directly (Sep 8) as the next entity-type round, explicitly "built+seeded the same way as round 29" — meaning built and seeded correctly in one pass. This is entity type 3 of the six in `partner-marketing-domain-concept.md` ("Get Help" section). DSOs, community orgs, and employers (types 4-6) remain unauthorized — do not start those.

**Note on numbering:** this is round 34, not round 32 — round 32 already covers the accredited-representatives rework (rename to `/accredited-representatives`, permalinks, real DOJ seed data), and round 33 covers the nav-placement fixes. Both are done. This task builds on that work rather than repeating it.

**Consistency update, Sep 8: build this nationwide from day one, not Florida-first.** Peter's direct instruction: the state-selector filter applies consistently across every directory-shaped entity type, not just accredited representatives. **Round 35 has already shipped this** — `src/components/StateFilter.tsx` (a state dropdown + free-text search box) is live on `/accredited-representatives` (2,586 nationwide records) and `/attorneys`. **Reuse that component directly, do not build a second one.** It takes pre-derived plain data as props (not functions — a real Server/Client Component boundary bug was found and fixed building it, see `CLOUD_CLAUDE.md`'s "Round 35 Parts 2-3" for the pattern to follow), so the entity-specific mapping happens in `/legal-aid`'s own Server Component page before data crosses into `<StateFilter>`. Legal aid orgs ships with all states represented and a working dropdown+search from day one — never a Florida-only cut with a follow-up expansion round like round 29→32 needed.

## Part 1 — the standard entity-type template

Same pattern as attorneys (round 27/28) and accredited representatives (round 29/32), applied to legal aid / nonprofit immigration organizations:

- **Table**: `legal_aid_directory` (seeded entries) — fields: org name, org type (per DOJ's own classification — see Part 2), contact person (if the source data has one; many won't, leave null), address, **state (its own filterable column, not just embedded in the address string)**, phone, population/regions served, services offered, source + last-verified date. Match the column conventions already used in `accredited_representative_directory` where they apply.
- **Applications table**: `legal_aid_applications` (self-enrollment submissions), same shape as `representative_applications`.
- **Public page**: `/legal-aid` — same disclaimer language already used on `/attorneys` and `/accredited-representatives` ("informational listing, not an endorsement"). Public, no sign-in required.
- **Join page**: `/legal-aid/join` — self-enroll form for orgs not yet listed, same pattern as `/accredited-representatives/join`.
- **Per-entry permalinks**: every listed org gets its own page at `/legal-aid/<slug-or-id>` — this is a hard requirement across all six entity types (decided Sep 8, and already the pattern for the two live entity types after round 32). **Two things to get right from day one, per real bugs found on `/accredited-representatives`'s permalink pages and fixed in round 36 (`round36-permalink-backlink-bug-task.md`) — check that round's fix and reuse the same approach:** (1) the "back to all legal aid orgs" link must be a real, clickable hyperlink, never literal markdown syntax rendered as text; (2) clicking it must return to the previous list view with whatever state/search filter was applied, not reset to the unfiltered national list. If round 36 hasn't landed yet when this round starts, check its status first — the fix it establishes should be reused here, not re-derived.
- **Admin notification**: new submissions to `/legal-aid/join` notify the same way `/accredited-representatives/join` does.

### "Free, always" messaging — required, not optional

Add the same statement already live on the other entity pages since round 32: something like "Free to use, always — no fees, no ads, no hidden cost" near the top disclaimer on `/legal-aid`, and "Free to join — we never charge organizations to be listed" on `/legal-aid/join`.

### State-selector dropdown + text search — required from the start, not a follow-up

`/legal-aid` reuses `<StateFilter>` (`src/components/StateFilter.tsx`, shipped round 35), the same component already live on `/accredited-representatives` and `/attorneys`: a state dropdown (defaulting to all states, no filter) plus a free-text search box that narrows the selected state's results by name/city/address substring. This is the standard template now for every directory-shaped entity type — see the consistency note at the top of this doc. Reason for text search rather than a city dropdown: with a few hundred entries spread across 50 states, a rigid city-level filter would return empty results for most towns — free text lets someone narrow to their actual area without that failure mode.

### Wire into `/get-help`

The hub page currently shows legal aid orgs as a "Coming soon" card. Update it to link to `/legal-aid` like the Attorneys and Accredited representatives cards already do.

## Part 2 — seed it with real data, in this same round

Source: the **recognized-organizations** side of the same DOJ EOIR roster round 29/32 already used — `https://www.justice.gov/eoir/page/file/942301/download`. This is the combined roster (recognized organizations + their accredited representatives); round 32 pulled the individual-representative rows into `scripts/seed-accredited-representatives.ts` and `scripts/data/fl-accredited-representatives-2026-08-30.json` — this task pulls the **organization** rows from that same document. Using this source (rather than EOIR's separate pro-bono-providers list) avoids that list's explicit "not for solicitation of paid legal services" restriction — recognized-organization status carries no such caveat, since DOJ recognition is the vetting mechanism itself.

**Reuse round 32/35's actual working pipeline rather than rebuilding one.** Look at `scripts/seed-accredited-representatives.ts` first — round 35 already extended it from Florida-only to nationwide (2,586 records, 49 states + DC), so it's the current reference for the parsing approach (`pdfplumber`), the real parsing bugs it hit and fixed (alphabetical section-divider rows miscounted as orgs, malformed ZIPs failing the state regex, a page-boundary table-extraction bug that misattributed representatives to the wrong organization — see `CLOUD_CLAUDE.md`'s "Round 35 Parts 2-3" for the full detail), the "skip lapsed entries" logic, and the source-citation convention. Write the organization-side equivalent (e.g. `scripts/seed-legal-aid-orgs.ts` + a matching `scripts/data/legal-aid-orgs-<date>.json`, national from the start) following that established pattern — and watch for the same class of parsing bugs round 35 found, since this pulls from the same PDF.

Steps:
1. Parse out the **organization** records (name, address, phone) from the same downloaded PDF — distinct from the individual accredited-representative records round 32/35 already extracted. Include every U.S. state plus DC (round 35 confirmed no territories are in this roster at all — no need to re-check).
2. Parse a clean `state` value onto each record (not just an address string) so the shared state-selector dropdown can filter on it directly.
3. Cross-check the parsed count against a manual spot-check of the source structure across multiple states, not just one — verify multi-line addresses and page-break entries aren't silently dropped, same discipline round 32 applied.
4. Skip anything reading as no-longer-current per the document's own status conventions.
5. Apply the migration and seed `legal_aid_directory` against production (same two-step round 32 had to do after inheriting an unmigrated/unseeded table — don't leave this one half-done either).
6. Cite source URL + pull date on the page.
7. Confirm each seeded entry renders at its own `/legal-aid/<slug-or-id>` permalink before marking this done — use a state-aware or id-based slug scheme from the start (not name-based) so entries from different states can't collide, same fix round 35 applies to accredited representatives.

## The lesson from round 29/32, applied here directly

Round 29's original task doc specified this same two-part shape (build + seed) and the seed step didn't ship with it — it took a separate round (32) to actually migrate, seed, and verify. **Part 2 here is not optional, not a follow-up, and not deferred — it ships in the same round as Part 1, migrated against production and verified with a real query, or the round isn't done.**

## Verify live

Same bar as every other round: `tsc`/lint clean, production build succeeds, `/legal-aid` and at least one real seeded `/legal-aid/<slug-or-id>` permalink confirmed live (real browser click-through if available this session, or the same honest "verified via direct query/HTTP, flagged as lighter-touch" approach rounds 32/33 used if not), the join form and admin notification confirmed working, the "free" messaging actually visible on both pages, the state dropdown + text search both confirmed working with multiple non-Florida states represented, and the permalink page's "back to all" link confirmed as a real clickable hyperlink that returns to the previously filtered view (not the unfiltered list). Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
