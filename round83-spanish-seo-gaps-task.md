# New task for Claude Code — round 83: SEO gaps for the Spanish pages added in rounds 78-80

Status: authorized now, Sep 13. Rounds 78-80 added Spanish versions of the landing page, /plus, Get Help, auth flow, and the signed-in app shell, with hreflang tags required in each of those rounds. This round closes three specific gaps that weren't in scope anywhere yet, since round 73 (the SEO foundation round) was written before any Spanish routes existed.

## 1. Spanish meta titles and descriptions

Round 73 required a real, unique <title> and meta description on every public page — but that was scoped to the English pages that existed at the time. Audit every Spanish route added in rounds 78-80 (casewhy.com/es, app.casewhy.com/es/plus, app.casewhy.com/es/get-help, etc.) and confirm each has its own Spanish-language title and meta description, not an inherited English one and not a duplicate of the English page's metadata. Without this, a Spanish page can get indexed with English metadata, which undercuts ranking for Spanish-language searches — the entire point of this work.

## 2. Schema markup on Spanish pages

Round 73's FAQ/HowTo structured data (on /faq, processing-times, visa-bulletin, etc., if those pages have Spanish versions by the time this round runs) was scoped English-only. For each schema-bearing page that now has a Spanish version, either add a Spanish-language equivalent of the structured data or confirm the existing schema correctly references the right page via inLanguage/hreflang-aware markup — check current best practice for how search engines expect multilingual structured data to be linked rather than guessing at the right approach.

## 3. Confirm sitemap coverage — verify, don't assume

Round 73 specified the sitemap as build-time-generated and always current, which should mean /es routes are already picked up automatically with no extra work. Confirm this is actually true by inspecting the live, generated sitemap.xml on both domains and checking that Spanish URLs are actually present — don't treat "it was built to auto-include everything" as sufficient without checking the real output, since round 73 was written before these routes existed and this is exactly the kind of assumption that's cheap to verify and expensive to get wrong silently.

## Verify live

Fetch each Spanish page directly and confirm its title/meta description are genuinely in Spanish and page-specific (not copy-pasted across pages). Validate any updated structured data against Google's Rich Results Test. Confirm both domains' live sitemap.xml actually lists the Spanish routes. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing round 73 and rounds 78-80.
