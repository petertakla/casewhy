# New task for Claude Code — round 59: screen attorney/representative listings against EOIR's disciplined-practitioners list

**Status: authorized now, Sep 10 — Peter said yes directly.** A second, distinct EOIR resource, surfaced alongside round 58's pro bono list but a genuinely different kind of use: `https://www.justice.gov/eoir/list-of-currently-disciplined-practitioners` — a real, actively-maintained roster (last updated Sep 2, 2026 — 8 days before this task was written) of attorneys and representatives currently disbarred, suspended, or otherwise barred from practicing before EOIR. CaseWhy has never cross-checked any listing against this or anything like it. This is a safety/trust feature, not a new directory — no new Get Help entity type, no new page for browsing.

## What this data is — checked directly

Presented as an HTML table (not a downloadable CSV/structured file) with these fields per entry: practitioner name (some include aliases), city/state of practice, date immediate suspension was imposed (linked to a PDF order), final discipline imposed (e.g. "Disbarred," "Suspended — 3 years"), effective date of discipline, and reinstatement status (yes/no with dates). No API, no bulk export — Claude Code will need to fetch and parse the live HTML table directly rather than relying on a static snapshot, since this list changes (new entries flagged "(NEW)" on the page itself).

## Two real uses — build both

1. **Screening gate on new self-enrolled applications.** Every attorney/representative join flow that currently exists or gets built (`/attorneys/join`, any future `/pro-bono-representation/join` from round 58, and anything analogous for accredited representatives) should check the submitted name (plus state, since names collide) against this list before the application is auto-approved or listed. Given real name-matching is inherently fuzzy — common names, aliases, middle-name variations — **do not auto-reject on a match.** A match should land the application in a "flagged for review" state instead of the normal pending/approved flow, with the matched disciplinary record's details attached, so Peter reviews it manually before it goes live. Wrongly blocking a legitimate applicant over a name collision is a real cost; err toward a human check, not an automated block.

2. **Periodic re-check of everything already listed.** The machine-seeded board-certified attorneys (round 40, 272 entries) and DOJ-recognized accredited representatives (round 29) were seeded once and haven't been checked against discipline records since. Build a script that runs the same name+state matching against every currently-listed attorney and accredited representative, and reports matches for Peter's manual review — **don't auto-delist anyone automatically**, same reasoning as above. This is a detection/reporting tool, not an automated removal mechanism, at least for this first version.

## Matching approach — be honest about the limits

Exact name matching will both miss real matches (nicknames, middle initials, maiden/married names) and produce false positives (common names shared by unrelated people). Use name + state as the matching key at minimum, and consider a normalized/fuzzy match (e.g. Levenshtein distance or a name-similarity library) with a confidence score rather than only exact string equality — but report the match with its confidence level explicitly, don't silently treat a fuzzy match the same as an exact one. If matching quality turns out to be too unreliable to be useful (a real possibility worth checking honestly, not assuming away), say so plainly in your report rather than shipping something that produces mostly noise.

## Scheduling

This shouldn't wait for the existing quarterly (DOJ-sourced) or annual (board-certification) refresh cadences from round 42 — attorney discipline is time-sensitive in a way stale contact info isn't. Recommend a monthly check as its own cadence, separate from those two. Build the script first; the cloud session will set up the actual scheduled task (via the scheduled-task tooling, not local cron) once the script exists and works — flag in your completion report that this is ready for a scheduled task to be wired up, rather than trying to schedule anything yourself.

## What must not change

No automated delisting or auto-rejection in this first version — every match is a flag for Peter's manual review, not an automatic action. Don't touch the pro bono representation directory from round 58 unless that round has already shipped by the time this one starts (if it has, include it in the screening scope; if not, screen attorneys + accredited representatives only, and note the gap).

## Verify live

Confirm a real test: seed a known name from the disciplined-practitioners list as a test self-enrolled application and confirm it gets correctly flagged rather than auto-approved (clean up the test data after); run the re-check script against the real live attorney/accredited-rep tables and report the actual number of matches found (if any) and their confidence levels — this is a real, useful data point on its own, report it honestly whether the answer is zero matches or several. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status, including whether the matching approach felt reliable enough to trust, since that shapes whether this is worth expanding later.
