# New task for Claude Code — round 36: fix the broken permalink back-link, standard across all six entity types

**Status: authorized now, high priority (real live bug).** Round 35 (nav bug + nationwide accredited representatives + the shared `<StateFilter>` component) is fully done — see `CLOUD_CLAUDE.md`'s "Round 35 Parts 2-3" section. This is a separate item Peter found live afterward, looking at a real seeded entry's permalink page, and it's numbered as its own round rather than folded into round 35 since that round is already closed out and verified.

## The bugs

Looking at `/accredited-representatives/[slug]` (a real seeded entry, e.g. the "Riviera Beach" one confirmed in round 35's own verification), Peter found:

1. **The "back to all" link isn't a real hyperlink.** The page shows literal, unrendered text reading `[All accredited representatives](https://app.casewhy.com/accredited-representatives)` — raw markdown link syntax, not an actual clickable `<a>`/Next.js `<Link>`. Find wherever this copy is written (likely a markdown string passed straight into JSX without going through a markdown renderer, or a component that was supposed to wrap it in an anchor and doesn't) and fix it so it renders as a real, clickable hyperlink. Check every existing permalink page for the same issue, not just this one instance — this pattern may repeat anywhere similar "back to list" or "back to hub" copy exists (e.g. `/get-help`).
2. **Clicking that link (once it's a real link) should return to the previous list view exactly as the user left it — including whatever `<StateFilter>` selection was applied — not reset to the unfiltered national list.** Right now it hard-links to the bare `/accredited-representatives` URL, dropping any state/search filter the user had applied before clicking into an entry.

**This is now a standard requirement across all six entity types' permalink pages, not just accredited representatives** — same "consistency across all six" instruction that produced the shared `<StateFilter>` component itself.

## How to implement the persistence correctly

The cleanest approach: have `<StateFilter>` (or the pages using it) reflect its current selection in the URL's own query string (e.g. `/accredited-representatives?state=FL&q=riviera`) rather than only in component state — this also makes filtered views linkable/shareable/bookmarkable as a side benefit, and round 35's component may already be close to this depending on how state is currently managed (check before assuming a rebuild is needed). Then the "view details" link from a list card to its permalink page carries that same query string forward (e.g. as a `from=` param, or by relying on browser history), and the permalink page's "back to all" link either does a real `router.back()` (simplest, works automatically if the list URL already had the filter in it) or reconstructs the list URL from carried-forward params. The requirement is the behavior — land back on the same filtered view — not a specific mechanism; pick whichever fits how `<StateFilter>` is actually structured today.

## Scope

Fix on `/accredited-representatives/[slug]` now (the only entity type with real seeded permalinks live today). Apply the same fix/pattern to `/attorneys/[id]` if it has equivalent "back to all" copy, even though that directory is empty. Round 34 (legal aid orgs, not yet started) has already been updated to build `/legal-aid`'s permalinks with this fixed from day one, reusing whatever pattern this round establishes.

## Verify live

Confirm on a real permalink page: the back-link renders as an actual clickable hyperlink (not visible markdown text), and clicking it after applying a state and/or search filter on the list page returns to that same filtered view, not the unfiltered list. `tsc`/lint clean, production build succeeds, deployed and confirmed live with a real browser. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
