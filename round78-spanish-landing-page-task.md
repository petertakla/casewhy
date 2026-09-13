# New task for Claude Code — round 78: standalone Spanish landing page (Track 1 only — static marketing content)

Status: authorized now, Sep 12. Per claude_language-translation-concept.md's existing research and recommendation: Spanish is the clear first (and, for now, only) language to translate into — 17.2M LEP speakers nationally, nearly 10x the next-largest language, and Florida (CaseWhy's own home base) has a large Spanish-speaking population. That doc splits translation into two tracks with very different risk profiles; this round is Track 1 only — static marketing content — which is low-risk and doesn't need to wait for anything else. Track 2 (translated AI explanations and chat) stays explicitly out of scope and deferred, per that doc's own reasoning — getting a case explanation wrong in translation is a real harm, not a typo, and needs the same guardrail-testing discipline CW-31/CW-32 went through in English, repeated per language. Nothing in this round touches explainCaseStatus(), chatAboutCase(), or any AI-generated content.

## Real sequencing dependency — don't start the actual translation yet

This round should translate round 77's finished hero copy, not the pre-round-77 version. Round 77 (hero copy addition — AI/citations/does-it-apply-to-me/escalation toolkit) is queued ahead of this and changes the exact English text this round needs to translate. If round 77 hasn't shipped yet when this round starts, either wait for it or coordinate so the Spanish version reflects the final English wording, not a version that's about to become stale. Translating now and re-translating after round 77 lands would be wasted, duplicate work.

## Scope — what gets a Spanish version

* casewhy.com's landing page (hero, feature sections, "What's already built" cards, footer) — the actual target here, since this is the SEO/reach play.
* Nav strings needed to make the Spanish page itself navigable (a language toggle/switcher, at minimum).

## Scope — what stays English for now, on purpose

* /plus, /processing-times, /visa-bulletin, /news, and the in-app product (app.casewhy.com) — not part of this round. The concept doc lists these as Track 1 candidates too, but scoping this round to the landing page alone keeps it small and shippable; expanding to the rest of the static site is a natural follow-up round once this is live and reviewed, not bundled in now.
* Terms of Service and Privacy Policy — stay English-only, linked as-is from the Spanish page's footer. Translating legal documents needs the "English version controls in case of conflict" language the concept doc flags, which should go through the same attorney review already pending for the English billing terms — not decided or drafted here. A Spanish visitor clicking Privacy/Terms from the Spanish landing page reaching an English-only page is an acceptable, temporary state; don't machine-translate these as a stopgap.
* Any AI-generated content whatsoever (explicitly Track 2, out of scope per above).

## Technical approach

* next-intl (current standard for Next.js App Router i18n), URL-based locale routing — casewhy.com/es (or equivalent, matching whatever routing convention fits the existing static-site setup, which is a plain HTML/JS site on the main branch rather than the Next.js app; confirm the actual mechanism fits that stack rather than assuming the Next.js app's tooling applies here — this is casewhy.com, not app.casewhy.com).
* hreflang tags (en/es alternates) on both language versions, so search engines correctly serve the right version per searcher — this is the actual SEO mechanism the concept doc's reach argument depends on; don't ship the Spanish page without this.
* A visible language switcher on both versions — a Spanish-speaking visitor who lands on the English page (or vice versa) needs an obvious way to switch, not just correct server-side routing.
* Translation quality: AI-drafted is fine as a starting point (this is static marketing copy, not the case-explanation content Track 2's guardrail concerns are about), but have it reviewed by a native Spanish speaker before publishing if one is available — flag back if not, rather than shipping unreviewed machine translation as final.

## Verify live

Confirm casewhy.com's Spanish version renders correctly at its real URL, confirm hreflang tags are present and correct on both language versions, confirm the language switcher works both directions, confirm Terms/Privacy links from the Spanish page correctly go to the existing English pages (not a 404, not a guessed-at Spanish path that doesn't exist), confirm no AI-generated or in-app content was touched. tsc/lint clean if applicable to this stack, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing claude_language-translation-concept.md as the source decision.
