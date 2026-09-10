# New task for Claude Code — round 55: DSOs are missing the back-link fix everyone else already has

**Status: authorized now, Sep 10.** Peter asked how to get back from a detail page — checked directly: round 36 built a shared `<BackLink>` component (`src/components/BackLink.tsx`, uses `router.back()` so a filtered/searched list view is preserved, not reset) and it's live on `/accredited-representatives/[slug]` and `/attorneys/[id]`. Confirmed by grepping the actual repo just now that `/legal-aid/[slug]` and `/community-orgs/[slug]` also have it — but **`/dso/[slug]` does not.** A real, live gap: DSO detail pages are the one entity type where there's no way back except the browser's own back button.

## The fix

Add `<BackLink>` to `src/app/dso/[slug]/page.tsx`, same usage as the other four entity-type detail pages — nothing else needs to change, this is a one-file omission, not a design decision.

## Verify live

Confirm the back link renders and correctly returns to the filtered/searched `/dso` list state (not a reset list), matching the other four entity types' behavior exactly. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
