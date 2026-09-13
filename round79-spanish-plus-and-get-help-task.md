# New task for Claude Code — round 79: Spanish for /plus and the Get Help hub (Track 1 only, extends round 78)

Status: authorized now, Sep 13. Same Track 1 (static content) scope and Track 2 (AI-generated content) exclusion as round 78 — see claude_language-translation-concept.md for the underlying decision. This round extends Spanish coverage from casewhy.com's landing page into two specific pages on app.casewhy.com.

## Real stack difference from round 78 — don't assume the same mechanism carries over

Round 78 was casewhy.com — the static, plain HTML/JS marketing site (main branch). This round is app.casewhy.com — the actual Next.js app. These are two separate codebases with two separate deployments, so this needs its own i18n setup (Next.js App Router locale routing, next-intl), not a reuse of whatever round 78 built — even though it's conceptually the same library/approach. Confirm this distinction before assuming any shared infrastructure exists between the two.

## Scope — what gets translated

  - /plus — the pricing/feature marketing page in full: headline, feature breakdown, plan cards, comparison table, the short FAQ on that page. All static copy, no AI-generated or per-user content on this page.
  - /get-help — the hub page itself (six entity-type cards, the "Not sure which one you need?" chooser's fixed questions, the "informational listing, not an endorsement" disclaimer, the "free to use, always" messaging) and the static UI chrome on each entity-type list page (/attorneys, /accredited-representatives, /legal-aid, etc.) — headings, filter labels, the self-enrollment pitch line, the standing disclaimer, "Search on Google"/"Ask [AI] about this" link labels.

## Scope — what does NOT get translated, and why

  - The actual directory data — attorney names, firm names, addresses, organization names — stays as-is. This is real-world data, not copy; translating a person's name or a law firm's name would be wrong, not helpful. Only the labels and chrome around the data get a Spanish version.
  - /get-help/ask — the anonymous AI question-answering surface. This is Track 2 (AI-generated, per-question content), explicitly out of scope, same as every other AI surface in this project.
  - Terms of Service, Privacy Policy — unchanged from round 78's reasoning: stays English-only until the pending attorney review covers the "English version controls" language.
  - The Google/Gemini-or-ChatGPT verification links (round 48/51) — these open external, English-language tools regardless of the page's language; no translation work applies to them.

## Technical approach

  - next-intl with Next.js App Router locale routing (e.g. app.casewhy.com/es/get-help, app.casewhy.com/es/plus) — confirm the exact routing convention fits how app.casewhy.com's existing routes are structured before assuming a specific URL shape.
  - hreflang tags on both language versions of each page, same requirement as round 78.
  - The language switcher from round 78 should appear on these pages too — if round 78 built it as a casewhy.com-specific component, this round needs its own equivalent for app.casewhy.com (or a shared component if the two apps can reasonably share one — check, don't assume).
  - Translation quality: AI-drafted as a starting point is fine for this static copy, native-speaker review before publishing if available, same as round 78.

## Verify live

Confirm both pages render correctly in Spanish at their real URLs, confirm hreflang tags are correct, confirm the language switcher works and is discoverable on both pages, confirm directory data (names/addresses) is untouched while surrounding UI chrome is translated, confirm /get-help/ask and all AI-generated content remain English-only and unaffected, confirm Terms/Privacy links still go to the existing English pages. tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing round 78 and claude_language-translation-concept.md.
