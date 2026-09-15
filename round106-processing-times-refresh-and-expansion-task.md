# New task for Claude Code — round 106: processing times — refresh the 7 entries, add the 5 forms the case-add dropdown offers but the page doesn't, and make staleness visible

Status: authorized now, Sep 15 (Peter chose Option 1 — hand-captured, broader, refreshed monthly — over a scraper). Numbering: 101 done; 102–105 in Drive; per round 95 confirm 106 is free against CLOUD_CLAUDE.md and the tracker before building.

## Where it stands (read from the repo, Sep 15)

- src/lib/kb/processing-times.ts: 7 entries (i130-immediate-relative, i140-e11, i140-e21, i485-employment-based, i765-pending-i485, i751-removing-conditions, i90-10-year-renewal), one global PROCESSING_TIMES_AS_OF = "2026-09-05", FIELD_OFFICE_ONLY_FORMS, VISA_BULLETIN_TIED_NOTE, and the two locator URLs. All captured by driving egov.uscis.gov/processing-times in a real browser (CW-33: server-side fetch is Cloudflare-blocked; the old JSON API is gone — don't re-test, it's documented).
- src/lib/kb/case-type-timeline.ts (CASE_TYPES, round 22+): n400, n600, family-green-card, i751, employment-based, i129, i765, i131, i90, i589, i821d, other. Five of those have no entry on the page: N-600, I-129, I-131, I-589, I-821D — their dropdown blurbs say "no timeline sourced yet."
- The figures are ten days old today and will be a month old by the first refresh; nothing on the page says how old they are beyond the single as-of line.

## What to build

### 1. Refresh all existing entries

Re-drive the USCIS tool in a real browser (Claude in Chrome, same as CW-33) for each of the 7 and update the figure. Per-entry asOf replaces the single global constant (keep PROCESSING_TIMES_AS_OF as the max for the page header). Record in CLOUD_CLAUDE.md which entries changed and by how much.

### 2. Add the five missing forms

Capture from the same tool, choosing the category most CaseWhy users mean, and say which on the entry:

- I-131 — Advance Parole for a pending I-485 (the common case), National Benefits Center. Note on the entry that Re-entry Permits and Refugee Travel Documents are separate categories; capture those too if the tool gives them a number, else say "see the tool."
- N-600 — Certificate of Citizenship. Likely field-office/NBC; if the tool gives a national figure use it, otherwise add to FIELD_OFFICE_ONLY_FORMS with the same honest "no national figure" treatment as N-400.
- I-129 — H-1B (regular processing, the default) at the service center the tool defaults to; note that premium processing is 15 business days by statute and link USCIS's premium-processing page rather than capturing it.
- I-589 — affirmative asylum is adjudicated by asylum offices, not service centers; the tool may show per-office or "see notes." Capture what it shows; if it's office-specific, add to FIELD_OFFICE_ONLY_FORMS and link USCIS's asylum-office page. Do not invent a national figure.
- I-821D — DACA renewal, NBC.

Wire each into case-type-timeline.ts so the dropdown blurb shows the real figure with its as-of date instead of "no timeline sourced yet" (same pattern I-90/I-765 already use). Where a form is office-specific, the blurb keeps its current honest wording.

### 3. Make staleness visible, and make the refresh a routine

- /processing-times shows each entry's own as-of date. When any entry is older than 45 days, the page shows one muted line at the top: "Some figures are more than a month old — check the USCIS tool for the latest." (Spanish equivalent, manifest.) Not a red warning; a factual note.
- scripts/check-processing-times-age.ts prints every entry older than 35 days; wire it into CI as a warning, not a failure, so the age shows up in every build log.
- CLOUD_CLAUDE.md: a short "Monthly processing-times refresh" procedure — run the age script, re-drive the tool for every entry, update asOf, note changes, deploy. Peter's calendar has a monthly reminder on the 5th to kick this off; the cloud session checks the page's as-of dates in its weekly review.

## Out of scope

Any scraper, proxy, or automated fetch of the USCIS tool (Option 2 — declined). Office-by-office figures for N-400 / family I-485 / asylum (the locator links stay). Changing the page's layout beyond the as-of dates and the staleness line.

## Verify live

- /processing-times shows 12 entries (or 12 minus whichever were honestly moved to the office-specific list), each with an as-of date within the last week; the locator links still resolve.
- Case-add dropdown: I-131, N-600, I-129, I-589, I-821D each show a real figure with date, or the office-specific wording — none say "no timeline sourced yet" unless the tool itself gives nothing.
- Temporarily set one asOf to 60 days ago on a branch → the staleness line renders and the CI script warns → restore.
- /processing-times?lang=es renders the new strings in Spanish.
- tsc/lint/build clean, deployed; tracker last line → "107+ unclaimed". Report the before/after figures for the 7 refreshed entries.

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described, with two real corrections to the task doc's own assumed office, caught by checking the live tool directly rather than trusting the doc's framing: I-131 (Advance Parole and the combined Re-entry Permit/Refugee Travel Document category) and I-821D (DACA renewal) are both **Service Center Operations only** in the tool — neither offers a National Benefits Center option, contrary to the task doc's assumption for both.

The 7 existing entries were all confirmed unchanged after a full live re-drive: I-130 IR 24mo, I-140 EB-1 31mo, I-140 EB-2 2.5mo, I-485 employment 40mo, I-765 (c)(9) 11mo, I-751 33.5mo, I-90 10.5mo.

N-600 and I-589 were both confirmed — not assumed — to have no national figure: N-600's office dropdown lists ~90 individual field offices with no SCOPS/NBC option; I-589 isn't in the tool's Form dropdown at all, not even as a field-office-only entry. Both added to FIELD_OFFICE_ONLY_FORMS with an honest explanation. I-589 additionally links to USCIS's real Asylum Office Locator (found via USCIS's own Asylum landing page, since a first guessed URL 404'd) — `FieldOfficeOnlyForm` gained an optional per-entry `locatorUrl`/`locatorLabel`/`locatorLabelEs`, since this is a third, distinct locator type from the page's existing shared field-office/ASC links.

`PROCESSING_TIMES_AS_OF` changed from a hand-set constant to a derived value (the max of every entry's own `asOf`), so it can't silently drift out of sync with what the entries themselves say — a small but deliberate robustness improvement beyond the task doc's literal ask.

`scripts/check-processing-times-age.ts` verified in both states live: clean pass against real data, then a real warning (naming the exact stale entry, still exiting 0) after backdating one entry's `asOf` on a working copy, restored before committing.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 106," which also carries the standing monthly-refresh procedure for whoever runs the next one.
