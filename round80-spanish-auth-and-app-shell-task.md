# New task for Claude Code — round 80: Spanish for auth flow and signed-in app shell (Track 1 only, extends rounds 78-79)

Status: authorized now, Sep 13. Flagged by Claude Code during round 79: "Iniciar sesión" (translated per round 79) currently lands on a fully English sign-in form, and the signed-in nav (Dashboard, Ask, Plus, Get Help, Settings) has no Spanish version at all. That's a real, jarring inconsistency — a translated nav link leading to an all-English destination — worth fixing as its own round rather than leaving as a known gap.

## Scope — what gets translated (still Track 1: static chrome only)

  - Auth flow, in full: /auth/sign-up, /auth/sign-in (both password and magic-link modes), /auth/forgot-password, /auth/reset-password — every label, button, and static instructional string on these pages. All static form chrome, no AI-generated content anywhere in this flow.
  - Signed-in nav (AuthHeader.tsx) — Dashboard, Ask, CaseWhy Plus, Get Help, Settings, Sign out — the nav labels themselves.
  - Settings page (/settings) — Appearance (System/Light/Dark), Notifications section labels, News sources section labels. All static toggle/label chrome.
  - Dashboard and Ask page — UI chrome only, see the hard boundary below.

## The hard boundary — what does NOT get translated, and why this matters more here than in rounds 78-79

The Dashboard and Ask pages are where Track 1 and Track 2 sit right next to each other on the same screen, so this needs to be precise, not a blanket "translate the page":

  - Translate: the receipt-number search field's label and placeholder, the "What kind of case is this?" dropdown and its category labels, the "Track case" / "Stop tracking" button text, the Case Switcher's static chrome, the free/Plus limit messaging ("You're tracking the maximum of 3 cases..."), the question-counter text ("of free questions left this month"), the "Does it apply to me? / How it applies to me?" button labels themselves (round 66) — these are fixed UI strings.
  - Do NOT translate: the raw USCIS status text (CaseWhy doesn't control this, it's USCIS's own words, and machine-translating a government status description risks introducing real inaccuracy into something with legal weight), the AI-generated "What this means" explanation box, any chat response from /ask or the case-grounded chat, and the actual answers behind the "Does it apply to me?" buttons. All of this is Track 2 — explicitly deferred, per the standing decision, until there's real usage data and per-language guardrail testing.
  - Practically: a Spanish-speaking signed-in user will see a fully Spanish dashboard shell wrapped around English case-status text and English AI explanations, for now. That's an intentional, honest interim state — not a bug to "fix" by machine-translating the AI content as a stopgap. If this reads awkwardly in practice once it's live, that's itself useful signal for how urgent Track 2 actually is (see the standing recommendation: watch real Spanish-locale usage as a demand signal).

## Verify live

Confirm every auth-flow page renders correctly in Spanish end-to-end (sign-up through to a working session), confirm the signed-in nav is in Spanish and every link still points to the correct route, confirm Settings' toggles and labels are translated while their underlying functionality is untouched, confirm the Dashboard/Ask boundary above is respected exactly — spot-check that raw status text and AI explanations are still in English while everything around them is in Spanish. Confirm the language switcher (rounds 78-79) correctly carries the signed-in state across the language switch rather than signing the user out. tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing rounds 78-79 and claude_language-translation-concept.md.
