# New task for Claude Code — round 34: legal aid / nonprofit immigration orgs, build + seed

**Status: authorized now.** Peter greenlit this directly (Sep 8) as the next entity-type round, explicitly "built+seeded the same way as round 29" — meaning built and seeded correctly in one pass. This is entity type 3 of the six in `partner-marketing-domain-concept.md` ("Get Help" section). DSOs, community orgs, and employers (types 4-6) remain unauthorized — do not start those.

**Note on numbering:** this is round 34, not round 32 — round 32 already covers the accredited-representatives rework (rename to `/accredited-representatives`, permalinks, real DOJ seed data), and round 33 covers the nav-placement fixes. Both are done. This task builds on that work rather than repeating it.

**Consistency update, Sep 8: build this nationwide from day one, not Florida-first.** Peter's direct instruction: the state-selector dropdown (see round 35, which builds it as a shared component alongside the accredited-representatives nationwide expansion) applies consistently across every directory-shaped entity type, not just accredited representatives. If round 35 has already shipped its shared state-selector component by the time this round starts, reuse it directly rather than building a second one. If this round lands first, build the shared component here (name it generically, e.g. `StateFilter`, not tied to one entity type) so round 35 and every later entity type can reuse it instead of duplicating it. Either way: legal aid orgs ships with all states represented and a working dropdown, never a Florida-only cut with a follow-up expansion round like round 29→32 needed.

## Part 1 — the standard entity-type template

Same pattern as attorneys (round 27/28) and accredited representatives (round 29/32), applied to legal aid / nonprofit immigration organizations:

- **Table**: `legal_aid_directory` (seeded entries) — fields: org name, org type (per DOJ's own classification — see Part 2), contact person (if the source data has one; many won't, leave null), address, **state (its own filterable column, not just embedded in the address string)**, phone, population/regions served, services offered, source + last-verified date. Match the column conventions already used in `accredited_representative_directory` where they apply.
- **Applications table**: `legal_aid_applications` (self-enrollment submissions), same shape as `representative_applications`.
- **Public page**: `/legal-aid` — same disclaimer language already used on `/attorneys` and `/accredited-representatives` ("informational listing, not an endorsement"). Public, no sign-in required.
- **Join page**: `/legal-aid/join` — self-enroll form for orgs not yet listed, same pattern as `/accredited-representatives/join`.
- **Per-entry permalinks**: every listed org gets its own page at `/legal-aid/<slug-or-id>` — this is a hard requirement across all six entity types (decided Sep 8, and already the pattern for the two live entity types after round 32).
- **Admin notification**: new submissions to `/legal-aid/join` notify the same way `/accredited-representatives/join` does.

### "Free, always" messaging — required, not optional

Add the same statement already live on the other entity pages since round 32: something like "Free to use, always — no fees, no ads, no hidden cost" near the top disclaimer on `/legal-aid`, and "Free to join — we never charge organizations to be listed" on `/legal-aid/join`.

### State-selector dropdown + text search — required from the start, not a follow-up

`/legal-aid` gets the same shared filter component as `/accredited-representatives` and `/attorneys` (see round 35): a state dropdown (defaulting to all states, no filter) plus a free-text search box that narrows the selected state's results by name/city/address substring. This is the standard template now for every directory-shaped entity type — see the consistency note at the top of this doc. Reason for text search rather than a city dropdown: with a few hundred entries spread across 50 states, a rigid city-level filter would return empty results for most towns — free text lets someone narrow to their actual area without that failure mode.

### Wire into `/get-help`

The hub page currently shows legal aid orgs as a "Coming soon" card. Update it to link to `/legal-aid` like the Attorneys and Accredited representatives cards already do.

## Part 2 — seed it with real data, in this same round

Source: the **recognized-organizations** side of the same DOJ EOIR roster round 29/32 already used — `https://www.justice.gov/eoir/page/file/942301/download`. This is the combined roster (recognized organizations + their accredited representatives); round 32 pulled the individual-representative rows into `scripts/seed-accredited-representatives.ts` and `scripts/data/fl-accredited-representatives-2026-08-30.json` — this task pulls the **organization** rows from that same document. Using this source (rather than EOIR's separate pro-bono-providers list) avoids that list's explicit "not for solicitation of paid legal services" restriction — recognized-organization status carries no such caveat, since DOJ recognition is the vetting mechanism itself.

**Reuse round 32's actual working pipeline rather than rebuilding one.** Look at `scripts/seed-accredited-representatives.ts` first — same PDF, same parsing approach (`pdfplumber`/`pypdf`), same "skip lapsed entries" logic, same source-citation convention — but **do not carry over its Florida-only filter**; round 35 is removing that same filter from the accredited-representatives side for the same reason (Peter wants full national coverage everywhere, not a Florida-first pattern repeated per entity type). Write the organization-side equivalent (e.g. `scripts/seed-legal-aid-orgs.ts` + a matching `scripts/data/legal-aid-orgs-<date>.json`, national, not `fl-`-prefixed) following that established pattern minus the geography filter.

Steps:
1. Parse out the **organization** records (name, address, phone) from the same downloaded PDF — distinct from the individual accredited-representative records round 32 already extracted. Include every U.S. state plus DC (and territories if the roster includes them — check rather than assume, same as round 35).
2. Parse a clean `state` value onto each record (not just an address string) so the shared state-selector dropdown can filter on it directly.
3. Cross-check the parsed count against a manual spot-check of the source structure across multiple states, not just one — verify multi-line addresses and page-break entries aren't silently dropped, same discipline round 32 applied.
4. Skip anything reading as no-longer-current per the document's own status conventions.
5. Apply the migration and seed `legal_aid_directory` against production (same two-step round 32 had to do after inheriting an unmigrated/unseeded table — don't leave this one half-done either).
6. Cite source URL + pull date on the page.
7. Confirm each seeded entry renders at its own `/legal-aid/<slug-or-id>` permalink before marking this done — use a state-aware or id-based slug scheme from the start (not name-based) so entries from different states can't collide, same fix round 35 applies to accredited representatives.

## The lesson from round 29/32, applied here directly

Round 29's original task doc specified this same two-part shape (build + seed) and the seed step didn't ship with it — it took a separate round (32) to actually migrate, seed, and verify. **Part 2 here is not optional, not a follow-up, and not deferred — it ships in the same round as Part 1, migrated against production and verified with a real query, or the round isn't done.**

## Verify live

Same bar as every other round: `tsc`/lint clean, production build succeeds, `/legal-aid` and at least one real seeded `/legal-aid/<slug-or-id>` permalink confirmed live (real browser click-through if available this session, or the same honest "verified via direct query/HTTP, flagged as lighter-touch" approach rounds 32/33 used if not), the join form and admin notification confirmed working, the "free" messaging actually visible on both pages, and the state dropdown + text search both confirmed working with multiple non-Florida states represented. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
