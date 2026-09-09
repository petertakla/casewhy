# New task for Claude Code — round 39: strengthen the "not a referral service" disclaimer on Get Help pages

**Status: authorized now.** Peter's direct instruction (Sep 9): the disclaimer on the attorney directory needs specific, stronger wording than the existing generic "informational listing, not an endorsement" line — language that explicitly rules out being a lawyer referral service. This isn't just a wording preference: it's a real mitigation against the open question in `attorney-referral-directory-concept.md` about whether an unpaid attorney directory could be classified as a regulated "qualifying provider" under rules like Florida Bar Rule 4-7.22 (which defines that term to include "directories"). Explicit, prominent "does not constitute a referral service" language is exactly the kind of thing that helps on that front, so get the wording and placement right.

## Required disclaimer text — exact wording for `/attorneys`

Peter's exact wording, verbatim, must appear on the page:

> "This directory is for informational purposes only. It does not constitute a lawyer referral service, and listing does not imply an endorsement or recommendation by this platform."

**Placement: clear and prominent** — not buried in fine print at the page footer. Near the top of `/attorneys`, above or alongside the existing disclaimer/"free, always" messaging, in text that's actually readable at normal size (not a tiny gray footnote). If there's already a disclaimer box/banner component on this page from earlier rounds, this replaces or is added to it — don't create a second, separate disclaimer block if one already exists; consolidate.

## Apply the same standard to all six Get Help entity types, adapted wording

Per the standing project convention (disclaimer/messaging requirements have applied uniformly across all six entity types since round 32 — "free, always" messaging, back-link behavior, state filter, etc.), this disclaimer requirement extends to every entity-type page, not just attorneys. Use this adapted wording for the non-attorney pages (the core legal point — informational only, not a referral service, no endorsement — stays the same; only the noun changes to match what's actually being listed):

- **`/attorneys`** — exact wording above (lawyer referral service).
- **`/accredited-representatives`** — "This directory is for informational purposes only. It does not constitute a referral service, and listing does not imply an endorsement or recommendation by this platform."
- **`/legal-aid`** (round 34, check current status before touching — if not yet built, fold this requirement into that round instead of shipping it separately) — same adapted wording as accredited representatives.
- **DSOs, community orgs, employers** — not yet built (unauthorized entity types 4-6). No page to update yet, but note this requirement in `partner-marketing-domain-concept.md`'s standing template so it's included when those types are eventually authorized, rather than needing a follow-up round like this one.

Check whether round 34 (legal aid orgs) has already shipped by the time this task starts — if it's live, update `/legal-aid` directly as part of this round; if it hasn't shipped yet, add this disclaimer requirement to that round's own task doc instead of doing it twice.

## Also update the Terms of Service

Peter's instruction: this same disclaimer language belongs in the Terms of Service too, not just on the pages. **This is a Terms-of-Service content change — do not implement ToS wording changes without a separate, explicit go-ahead from Peter on the exact legal text**, per the established pattern for every prior Terms/Privacy change on this project (Sep 7 and Sep 8 additions, and the pending Sep 9 Get Help additions doc). The pending `terms-get-help-directory-additions-sep9.md` proposal (Section 10 addition) has been updated to lead with this exact sentence — when Peter approves that document, build the approved wording into `terms.html` in the same pass. Do not treat this task doc as authorization to edit `terms.html` on its own.

## Verify live

Exact wording confirmed present and prominent on `/attorneys` (screenshot or direct fetch), adapted wording confirmed on `/accredited-representatives` and `/legal-aid` (if live), `tsc`/lint clean, production build succeeds, deployed and confirmed live. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
