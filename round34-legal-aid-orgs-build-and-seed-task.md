# New task for Claude Code — round 34: legal aid / nonprofit immigration orgs, build + seed

**Status: authorized now.** Peter greenlit this directly (Sep 8) as the next entity-type round, explicitly "built+seeded the same way as round 29" — meaning built and seeded correctly in one pass. This is entity type 3 of the six in `partner-marketing-domain-concept.md` ("Get Help" section). DSOs, community orgs, and employers (types 4-6) remain unauthorized — do not start those.

**Note on numbering:** this is round 34, not round 32 — round 32 already covers the accredited-representatives rework (rename to `/accredited-representatives`, permalinks, real DOJ seed data), and round 33 covers the nav-placement fixes. Both are done. This task builds on that work rather than repeating it.

## Part 1 — the standard entity-type template

Same pattern as attorneys (round 27/28) and accredited representatives (round 29/32), applied to legal aid / nonprofit immigration organizations:

- **Table**: `legal_aid_directory` (seeded entries) — fields: org name, org type (per DOJ's own classification — see Part 2), contact person (if the source data has one; many won't, leave null), address, phone, population/regions served, services offered, source + last-verified date. Match the column conventions already used in `accredited_representative_directory` where they apply.
- **Applications table**: `legal_aid_applications` (self-enrollment submissions), same shape as `representative_applications`.
- **Public page**: `/legal-aid` — same disclaimer language already used on `/attorneys` and `/accredited-representatives` ("informational listing, not an endorsement"). Public, no sign-in required.
- **Join page**: `/legal-aid/join` — self-enroll form for orgs not yet listed, same pattern as `/accredited-representatives/join`.
- **Per-entry permalinks**: every listed org gets its own page at `/legal-aid/<slug-or-id>` — this is a hard requirement across all six entity types (decided Sep 8, and already the pattern for the two live entity types after round 32).
- **Admin notification**: new submissions to `/legal-aid/join` notify the same way `/accredited-representatives/join` does.

### "Free, always" messaging — required, not optional

Add the same statement already live on the other entity pages since round 32: something like "Free to use, always — no fees, no ads, no hidden cost" near the top disclaimer on `/legal-aid`, and "Free to join — we never charge organizations to be listed" on `/legal-aid/join`.

### Wire into `/get-help`

The hub page currently shows legal aid orgs as a "Coming soon" card. Update it to link to `/legal-aid` like the Attorneys and Accredited representatives cards already do.

## Part 2 — seed it with real data, in this same round

Source: the **recognized-organizations** side of the same DOJ EOIR roster round 29/32 already used — `https://www.justice.gov/eoir/page/file/942301/download`. This is the combined roster (recognized organizations + their accredited representatives); round 32 pulled the individual-representative rows into `scripts/seed-accredited-representatives.ts` and `scripts/data/fl-accredited-representatives-2026-08-30.json` — this task pulls the **organization** rows from that same document. Using this source (rather than EOIR's separate pro-bono-providers list) avoids that list's explicit "not for solicitation of paid legal services" restriction — recognized-organization status carries no such caveat, since DOJ recognition is the vetting mechanism itself.

**Reuse round 32's actual working pipeline rather than rebuilding one.** Look at `scripts/seed-accredited-representatives.ts` first — same PDF, same parsing approach (`pdfplumber`/`pypdf`), same Florida-first filter, same "skip lapsed entries" logic, same source-citation convention. Write the organization-side equivalent (e.g. `scripts/seed-legal-aid-orgs.ts` + a matching `scripts/data/fl-legal-aid-orgs-<date>.json`) following that established pattern rather than a new one.

Steps:
1. Parse out the **organization** records (name, address, phone) from the same downloaded PDF — distinct from the individual accredited-representative records round 32 already extracted.
2. Filter to Florida addresses.
3. Cross-check the parsed count against a manual spot-check of the source structure — verify multi-line addresses and page-break entries aren't silently dropped, same discipline round 32 applied.
4. Skip anything reading as no-longer-current per the document's own status conventions.
5. Apply the migration and seed `legal_aid_directory` against production (same two-step round 32 had to do after inheriting an unmigrated/unseeded table — don't leave this one half-done either).
6. Cite source URL + pull date on the page.
7. Confirm each seeded entry renders at its own `/legal-aid/<slug-or-id>` permalink before marking this done.

## The lesson from round 29/32, applied here directly

Round 29's original task doc specified this same two-part shape (build + seed) and the seed step didn't ship with it — it took a separate round (32) to actually migrate, seed, and verify. **Part 2 here is not optional, not a follow-up, and not deferred — it ships in the same round as Part 1, migrated against production and verified with a real query, or the round isn't done.**

## Verify live

Same bar as every other round: `tsc`/lint clean, production build succeeds, `/legal-aid` and at least one real seeded `/legal-aid/<slug-or-id>` permalink confirmed live (real browser click-through if available this session, or the same honest "verified via direct query/HTTP, flagged as lighter-touch" approach rounds 32/33 used if not), the join form and admin notification confirmed working, and the "free" messaging actually visible on both pages. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
