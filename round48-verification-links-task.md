# New task for Claude Code — round 48: Google search + Gemini links on every Get Help detail page

**Status: authorized now.** Peter's ask: give users an easy way to do their own independent research on a listing, directly from its detail page — ties into the round-39 disclaimer and the ToS language's own "confirm directly, or through your own research" framing, giving that a real, one-click mechanism instead of leaving it as a suggestion in prose.

## Placement — detail pages only, all entity types

**Every entity-type permalink page** (`/attorneys/[id]`, `/accredited-representatives/[slug]`, `/legal-aid/[id]`, and DSOs/community-orgs once round 43 ships), **never the list/index pages** (`/attorneys`, `/accredited-representatives`, etc.) — Peter's explicit instruction. One line, two links, one at each end: "Search [Name] on Google" on the left, "Ask Gemini about [Name]" on the right. Same line, same visual treatment on every entity type — build once as a shared component (e.g. `<VerificationLinks name={...} context={...} />`) and reuse everywhere, same pattern as `<StateFilter>`/`<BackLink>`.

## Why two different links, not one, and why they're labeled differently

Discussed with Peter directly: the two links serve genuinely different purposes, and the labeling should be honest about that rather than presenting both as equivalent "verify this" buttons.

- **Google search** is the actual verification tool — it returns real web results (a bar-association profile, reviews, news mentions, the organization's own site) that a user can independently judge. Label it as search: "Search [Name] on Google."
- **Gemini** is a general-info assistant, not a verification tool — an LLM's synthesized answer carries real hallucination risk on exactly the kind of factual question that matters most here (is this attorney actually licensed, is this org still operating), so it should never be framed as confirming or verifying anything. Label it plainly as asking a question: "Ask Gemini about [Name]," not "Verify" or "Check."

## Query construction — public fields only, nothing fabricated

Build each link's query from fields already shown on that same detail page — name plus whatever distinguishing context exists for that entity type (organization/firm name, city, state). Examples: an attorney → `"[Full Name]" [Firm Name] [City] [State] immigration attorney`; a legal aid org → `"[Org Name]" [City] [State]`. Nothing sensitive goes into either link — directory listings are public data by design, same as every other piece of this feature. Don't add anything not already displayed on the page (no fabricated middle initial, no guessed suffix, etc.).

- **Google link**: `https://www.google.com/search?q=<encoded query>` — plain, no API key, opens in a new tab.
- **Gemini link**: confirm Gemini's actual current deep-link/prefill URL format before building rather than guessing at one (URL schemes for prefilling a prompt can change) — same verify-before-building discipline used everywhere else on this project. If no reliable prefill mechanism exists at build time, fall back to linking to `https://gemini.google.com/app` plain (no prefill) rather than a guessed-at parameter that might silently fail. Opens in a new tab, same as the Google link.

## Scope — exactly this

- No new tables, no tracking of which links get clicked (not part of this round — if click analytics matter later, that's a separate, explicit ask).
- No changes to the list/index pages.
- No ToS changes — this doesn't need Peter's separate sign-off gate since it's not adding a disclaimer claim, just a research convenience; if anyone thinks it's worth a line in the Terms later, flag it back rather than adding it here.

## Verify live

Confirm the two links render on a real permalink page for each live entity type, both open in new tabs, the Google link's query actually returns relevant results for a real seeded listing (spot-check a couple), the Gemini link's URL format is confirmed working (not a guess), list/index pages are untouched, `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status — including whatever Gemini deep-link format was actually confirmed, so it's on record rather than needing re-discovery later.
