# New task for Claude Code — round 109: a PLUS badge for the product name

Status: authorized now, Sep 15 (Peter approved it from a live browser mockup the cloud session injected into the header and /plus hero — screenshots in the Ideas project chat). Numbering: 101–103, 105, 107 done; 104, 106, 108 in Drive; per round 95 confirm 109 is free against CLOUD_CLAUDE.md and the tracker before building. Build order: 108 (hotfix) first, then this can go any time — it's small.

## Why a badge, not green text

Peter wanted "Plus" in green. The wordmark already makes green mean "Why" (Logo.tsx), so two green words a few inches apart in the header would compete for the eye. Approved resolution: a small outlined pill in the same green, not green text. A pill reads as a label; the wordmark reads as a name; they don't fight.

## What to build

- src/components/PlusBadge.tsx: <PlusBadge size="sm" | "lg" /> renders PLUS in small caps — font-size 10px (sm) / 14px (lg), font-weight 700, letter-spacing .08em, 1px (sm) / 1.5px (lg) border, border-radius 9999px, padding 1px 6px (sm) / 2px 10px (lg), no fill, color and border both the wordmark's green token (the same token Logo.tsx uses for "Why" — reuse it, don't add a shade). Vertical alignment: baseline-aligned with the adjacent text, sitting ~1px above the baseline — the mockup's vertical-align: 2px/6px was a hair high on the /plus heading; tune so the pill's optical centre matches the x-height of the text next to it.
- Use it everywhere the product name appears as a label: the header nav item ("CaseWhy" + sm badge, replacing the plain text "CaseWhy Plus"; the active-underline spans both), the /plus hero h1 (lg), the pricing table's Plus column header, the upgrade nudges/CTAs across the app ("Upgrade to CaseWhy PLUS"), the settings page's plan line, and the FAQ answers that name the tier (round 104's page, still in Drive — if 104 lands first, add the badge there; if 109 lands first, 104 uses the component). Plain prose (blog posts, emails, JSON-LD, <title>, meta descriptions, the Spanish manifest strings) keeps the words "CaseWhy Plus" — the badge is visual only, and screen readers must still read "CaseWhy Plus" (render the text Plus inside the pill with CSS small-caps, or add aria-label="CaseWhy Plus" on the wrapper; don't ship an aria-label of "PLUS" alone).
- Static site (main): the same pill as one CSS class in index.html/es/index.html wherever "CaseWhy Plus" appears as a label (the pricing/feature section), byte-identical across files as in round 102.
- Contrast: verify the green on the light theme background passes WCAG AA for the 10px text (the wordmark green passes today — confirm for the smaller size; if it fails, use the next-darker step of the same token for the light theme only, and say so).
- grep -rn "CaseWhy Plus" src --include=*.tsx afterwards returns only prose/metadata/aria uses, no labels.

## Out of scope

Any other color or typography change. Renaming the tier. Touching the pricing table's numbers (round 50).

## Verify live

- Header (desktop and 390px), /plus hero and pricing column, settings plan line, one upgrade nudge, static-site pricing section — both themes, screenshots in CLOUD_CLAUDE.md.
- Screen reader / accessibility tree: the nav item is announced as "CaseWhy Plus".
- Light-theme contrast result recorded (pass, or which darker step was used).
- tsc/lint/build clean on both branches, deployed; tracker last line → "110+ unclaimed".

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described, with a real correction to the task doc's own premise: "the wordmark green passes today" turned out to only be true for the dark theme. A direct contrast calculation (not eyeballed) showed the wordmark's own green (`#1baf7a`) measures 2.58:1 against this app's light-theme background (`#f7f5f0`) — well under WCAG AA's 4.5:1 for text this small, and under even the 3:1 large-text threshold. Followed the task doc's own fallback instruction: the badge uses `#137e58` (the same hue, RGB scaled to 72%, the darkest step that clears 4.5:1 at 4.64:1) on light theme; dark theme keeps the original green (6.86:1, passes comfortably). `Logo.tsx`'s own wordmark was not touched — out of this round's explicit scope, and the underlying gap is a pre-existing issue this round's contrast check happened to surface, not something round 109 caused. Flagged here for whoever picks it up next rather than fixed alongside this round's own work.

A second real correction: "the settings page's plan line" the task doc names doesn't exist — the current `/settings` page has no billing/subscription-tier UI at all, confirmed by reading the file. Nothing to badge there.

The badge's accessible text is the literal word "Plus" (via CSS `font-variant: small-caps`, not raw uppercase "PLUS" text), which combined with the "CaseWhy" text it always sits next to at every real call site reads as "CaseWhy Plus" via the browser's own text-concatenation, with no `aria-label` needed anywhere — confirmed directly: `document.querySelector('a[href="/plus"]').textContent.trim()` returns exactly `"CaseWhy Plus"` on the live production header.

Applied to: the signed-in header nav item, the `/plus` hero `<h1>` (both languages), the pricing table's Plus column header (both languages — this was previously plain blue `text-brand-600` text, not even the wordmark's own green), every upgrade nudge across the signed-in app (CheckNowButton, DownloadReportLink, DocumentVault, EscalationToolkit, TrackCaseButton's at-cap message, the dashboard's stalled-case nudge, and CaseChat's free-question-limit nudge — the last judged as functionally an "upgrade nudge" per the task doc's own category, phrased "Get unlimited questions with CaseWhy Plus" rather than "Upgrade to..."), and the static site's pricing-section heading (byte-identical CSS across `index.html`/`es/index.html`, per round 102's convention).

Verified live in a real browser, both themes: the header nav item, `/plus` hero, and pricing table header all render correctly with visible, legible contrast in both themes (a direct visual comparison against the wordmark's own lighter green in the same light-theme screenshot showed the badge's darker shade reading clearly while the wordmark itself looked visibly washed out — confirming the contrast finding wasn't just a numeric technicality). The remaining upgrade nudges (which share the exact same composition pattern, already proven correct by the nav/hero/pricing checks) weren't independently re-verified live, since none are reachable on the real production account without fabricating test data (no tracked case, no exhausted free-question quota) — not done, per this project's standing practice of using only real data in production.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 109."
