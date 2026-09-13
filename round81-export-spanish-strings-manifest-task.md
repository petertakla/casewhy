# New task for Claude Code — round 81: export all Spanish strings as a structured manifest for review

**Status: authorized now, Sep 13.** Rounds 78-80 add Spanish translations across casewhy.com's landing page, /plus, the Get Help hub, the auth flow, and the signed-in app shell. Before any of this goes to native-speaker review, every Spanish string needs to exist in one consolidated, structured place — reviewing scattered strings across two live codebases is how mistakes get missed. This round is the export only; no translation content should change as part of this round.

## What to produce

A single structured file (CSV or JSON — whichever is simpler to generate accurately from the actual codebase, not a manually retyped list) with one row per translated string, containing:

  - **Round / Page** — which round added it and which page/component it's on (e.g. "R78 — Landing hero," "R79 — /plus plan cards," "R80 — Sign-in form")
  - **Location** — the specific element (e.g. "Headline," "CTA button," "Plan card: Premium tier name," "Nav: Dashboard")
  - **English source** — the original English string being translated
  - **Draft Spanish** — the actual Spanish string currently shipped/in the branch
  - **Constraint** — any real UI limit that shaped the translation (e.g. "button, keep under ~20 chars," "single-line nav item") — flag these explicitly since a reviewer can't account for a constraint they don't know exists

**Register consistency check, not just a translation check:** note in the export (a header note, or a dedicated column) whether each string uses formal ("usted") or informal ("tú") register, so inconsistency across pages is visible at a glance rather than requiring the reviewer to hold the whole app's tone in their head. Decision on file: CaseWhy is standardizing on **usted** (formal) throughout, given the product's legal/government-adjacent nature — flag any string that doesn't match this for correction, don't silently leave inconsistent register in the export as if it were fine.

## What NOT to include

Anything from the explicit Track 2 exclusions in rounds 79-80 (AI-generated explanations, chat responses, raw USCIS status text) — these were deliberately left in English and shouldn't appear in a Spanish-strings export at all. If any of these show up, that's itself a signal something was translated that shouldn't have been — flag it back rather than including it as if it were in scope.

## Verify / deliver

Confirm the export is complete — cross-check the count of rows against a real grep/search of the actual translated files, not just what's remembered from the three task docs, so nothing shipped gets missed. Deliver the file itself (not just a summary) back through the usual handoff — this feeds directly into a review spreadsheet, so it needs to be the real, structured data, not a prose description of it.
