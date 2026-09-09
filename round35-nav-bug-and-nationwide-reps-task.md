# Round 35: fix the signed-out nav bug, build a shared nationwide state filter — DONE

**Status: complete.** All three parts of this task shipped live Sep 8 (Claude Code) — see `CLOUD_CLAUDE.md`'s "Round 35 Part 1" and "Round 35 Parts 2-3" sections for the full verified build notes. Kept here for the historical record and for the original spec; this doc is no longer an open task.

**A fourth item — the permalink "back to all" link rendering as raw markdown text instead of a real hyperlink, and not preserving the applied filter on click — was found live afterward and is tracked separately as round 36 (`round36-permalink-backlink-bug-task.md`), since it wasn't part of what round 35 built or verified.**

## What shipped

**Part 1 — signed-out nav bug, fixed.** Root cause: `onAppPage` was keyed off URL path, not session state, so a signed-out visitor landing on any public page overlapping `NAV_LINKS` (`/plus`, `/news`, `/processing-times`, `/visa-bulletin`) still got the full nav. Fixed by keying nav visibility off real `isSignedIn` session state instead. Verified live with a real browser.

**Part 2 — accredited representatives, Florida-only (98) → nationwide (2,586 records, 49 states + DC).** Re-ran the DOJ EOIR roster parse without the Florida filter, found and fixed several real parsing bugs along the way (including a page-boundary table-extraction bug that silently misattributed a handful of representatives to the wrong organization), cross-checked the new parse against round 32's hand-verified Florida baseline, and reseeded production. Slugs are now state-aware to avoid collisions at nationwide scale.

**Part 3 — a shared `<StateFilter>` component** (`src/components/StateFilter.tsx`) — a state dropdown plus free-text search box, not a city-level dropdown (per the "state is the guaranteed-non-empty primary filter, text search covers the rest" decision). Built once, generically, and wired into both `/accredited-representatives` and `/attorneys` (the latter still empty, but ready ahead of real entries). A real React Server/Client Component boundary bug was caught and fixed before shipping (functions can't cross that boundary as props; redesigned to pass pre-derived plain data instead).

## Original spec (for reference)

The original task asked for: (1) fixing the signed-out nav bug; (2) expanding accredited representatives nationwide with a state-selector dropdown, built as a shared/reusable component; (3) reusing that same component on `/attorneys` even though it's empty, so it's ready ahead of real entries; and free-text search alongside the state dropdown rather than a rigid city-level filter, since a strict city dropdown would return empty results for most towns given how few entries exist per state. All of this shipped as described above.

## Follow-on

Round 34 (legal aid orgs) reuses `<StateFilter>` as built here — see `round34-legal-aid-orgs-build-and-seed-task.md`. Round 36 (`round36-permalink-backlink-bug-task.md`) covers the permalink back-link bug found afterward.
