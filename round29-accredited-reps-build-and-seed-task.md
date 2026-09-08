# New task for Claude Code — round 29: build accredited-representatives directory, seed it with real DOJ data

**Status: authorized (round 29 was already greenlit as "next up"; Peter has now explicitly asked to populate it with a real baseline too, not ship it empty).** Build the full entity system per the standard template in `partner-marketing-domain-concept.md`, then seed it with real, current data from DOJ's own accreditation registry — Florida-first, per the same "go local first" logic already used for attorney outreach.

## Why this is safe to seed (unlike attorneys)

DOJ's EOIR is the actual accrediting authority for BIA-accredited representatives — being listed on their roster *is* the vetting, unlike attorneys where CaseWhy would need its own bar-lookup confirmation and, more importantly, the attorney's own consent to be listed. No consent gap here: this is public government data, explicitly published by DOJ for the purpose of being referenced. Full research trail is in `partner-marketing-domain-concept.md`.

## Part 1 — build the entity system (standard template)

Same shape as every other entity type in `partner-marketing-domain-concept.md`:
- `accredited_representative_directory` (public, approved) + `accredited_representative_applications` (pending) tables.
- Public listing page `/accredited-representatives`, same "informational listing, not an endorsement" disclaimer as `/attorneys`, plus a plain statement that this is free to use — decided Sep 8, applies across all six entity types (see `partner-marketing-domain-concept.md`'s new "Free, on both sides" section), not just this one.
- **Every entry gets its own permalink** at `/accredited-representatives/<slug-or-id>` — this is a hard requirement across all six entity types now (decided Sep 8), not just this one.
- Self-enroll application page `/accredited-representatives/join`, stating plainly that there's no cost to be listed — same reassurance the attorney directory's "free founding partner" framing implies, but said outright rather than left implicit.
- Notification to Peter on each new submission.

## Part 2 — seed it with real DOJ data, done properly (this is the part that needs real tooling, not a summarized fetch)

**Do not hand-transcribe this from a web-fetch summary of the PDF — I tried that from the cloud session and it produced a stale 2016 mirror on one attempt and a truncated "A through D surnames only" result on another, since the roster isn't organized by state.** This needs actual PDF parsing, not summarization, to be trustworthy.

1. **Source**: [Recognized Organizations and Accredited Representatives Roster](https://www.justice.gov/eoir/page/file/942301/download) (the combined-format PDF — organization name, full address, phone, plus each affiliated accredited representative's name, accreditation status, and expiration date). This is the address-inclusive version; there's a separate individual-only roster (942311) without addresses — don't use that one, since addresses are needed for each entry's detail page. Confirmed via [data.gov's catalog entry](https://catalog.data.gov/dataset/recognition-and-accreditation-ra) that these are DOJ's only two published formats (PDF only, no CSV/JSON) and the dataset is refreshed roughly weekly.
2. **Download and parse programmatically** — a short script (Python + `pdfplumber`/`pypdf`, or equivalent) that extracts the actual text/table structure and filters to entries with a Florida address. Verify the parse against the document's own stated total representative count (it prints "Number of Accredited Representatives: N" — cross-check your Florida subset count is plausible against that, not just trust the parse blindly).
3. **Fields per entry**: organization name, full address, phone, accredited representative name(s), representative status (full vs. "DHS only" — DHS-only reps can't appear before immigration courts, worth surfacing that distinction on the entry page rather than hiding it), accreditation expiration date, organization recognition status.
4. **Cite the source and the pull date on every seeded page** — e.g. "Sourced from the DOJ EOIR Accredited Representatives Roster, current as of [report's own 'Report Last Updated' date]." This is public government data, but showing where it came from and when matters for the same trust reasons the rest of this product cares about (same instinct as the CW-31 KB citing its sources directly on the dashboard, not folding them silently into prose).
5. **Skip any entry already past its accreditation expiration date or marked pending-renewal with an already-lapsed date** — don't seed with data DOJ's own roster shows as stale, even if it's technically still listed. A lapsed accreditation shown as current would be a real trust problem, not a minor data-quality nit.
6. **Refresh cadence**: this needs to become a recurring small task, not a one-time seed — same pattern already established for the visa-bulletin/processing-times knowledge base (`CW-34`), which also can't be automated reliably and gets refreshed by hand periodically. Note this here rather than treating today's pull as permanent.

## Sequencing

This is round 29's actual scope now — the build (Part 1) and the seed (Part 2) should ship together, not as a build-now/populate-later split, since an empty accredited-representatives page defeats the point of having real baseline data available on day one.
