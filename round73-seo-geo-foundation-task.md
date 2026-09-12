# New task for Claude Code — round 73: SEO/GEO technical foundation

Status: authorized now, Sep 12. CaseWhy is currently invisible to search — confirmed directly via site:casewhy.com and site:app.casewhy.com, both return zero results. Neither domain has ever been submitted or crawled. This round builds the technical foundation so that's fixable, without assuming anything about the still-undecided casewhy.com/app.casewhy.com domain merge (see the "path structure" note below for how this round stays correct either way).

## 0. Context — don't skip this framing

Two separate things are true and matter for how this round is built:

1. Getting indexed at all is the real, urgent problem — not keyword ranking. Nothing else here matters until Google/Bing actually know these pages exist.
2. A future merge of casewhy.com and app.casewhy.com into one domain is possible but not decided (Peter's own open call, gated on production USCIS API access — which itself gates real launch, so the technical blocker may clear around the same time launch does, but that's not the same as the merge being scheduled). Build everything in this round so it survives that merge cleanly if it happens, without assuming it will.

## 1. Get both domains indexable (do this first — everything else is wasted until this is done)

* Confirm robots.txt on both casewhy.com and app.casewhy.com isn't blocking crawlers from any public page (Get Help hub and all its entity-type sub-pages, /processing-times, /visa-bulletin, /news and its permalinks, /plus, the static marketing site). Auth-gated pages (dashboard, settings, account) should stay disallowed — this is about the already-public pages only.
* Generate/confirm a real sitemap.xml on each domain listing every public URL, kept current as new pages are added (a build-time generation step, not a hand-maintained static file, given how often this project adds new public pages).
* Confirm every public page has a real, unique <title> and meta description — not a generic template repeated site-wide. Spot-check a sample across both domains rather than assuming the framework's defaults are fine.
* This is the one item that needs a Peter-only follow-up, not code: once the above is live, submitting the sitemap to Google Search Console and Bing Webmaster Tools requires account-level domain verification — flag this back rather than attempting it, and hand Peter the two sitemap URLs once they exist.

## 2. Fix the production acceptance gate's crawlability (round 53)

Real risk found during this round's research, not in round 53's original scope: once the round-53 acceptance gate (Peter-only access for 1 week pre-launch) goes live, every other visitor — including search crawlers — hits the holding page instead of real content. If that holding page doesn't explicitly tell crawlers it's temporary, Google could index the holding page itself as the real page, or read it as thin/duplicate content across every route.

Fix: the holding page response should either return an HTTP 503 status (tells crawlers "temporarily unavailable, recheck later" — the standard, correct signal for this exact situation) or carry an explicit noindex meta tag if a 503 isn't practical given how the gate is implemented. Check which the current gate mechanism (round 53's env-var/allow-list check) can support without a bigger rework, and use whichever is cleaner. This should be verified before the gate is ever actually turned on, not discovered after.

## 3. Direct-answer blocks on existing content pages

Per current SEO/AI-answer-engine guidance, a short, direct answer near the top of each content section — before the fuller detail — measurably helps both classic search snippets and AI-answer extractability.

Add a 1-2 sentence direct-answer block under the main heading of each of these (they already have the underlying facts; this is a restructuring/addition, not new research):

* /processing-times — e.g., a top-line "USCIS's own published estimate for [form] is currently [X] months" framing before the fuller table.
* /visa-bulletin — a plain-language "what does 'current' mean and what changed this month" summary before the two detail tables.
* Each Get Help entity-type page (/attorneys, /accredited-representatives, /legal-aid, etc.) — a one-line "what this is and who it's for" directly under the page heading.

Keep existing content and disclaimers intact — this adds a summary, it doesn't replace the detail or caveats already there.

## 4. FAQ/HowTo structured data (schema markup)

Add FAQPage schema to any page that already reads as Q&A in substance (processing-times' "what does 80th percentile mean" type explanatory notes, visa-bulletin's "what does current mean" note, any existing FAQ-style content) and HowTo schema where a page walks through a real sequence of steps (e.g., the escalation toolkit's congressional-letter flow, if it has a public-facing explanation page). Don't fabricate Q&A structure onto pages that aren't naturally structured that way — only mark up what's genuinely already in that shape.

## 5. A public mirror of the policy-memo explanation content

The core gap: CaseWhy's actual differentiator — translating a USCIS status change or policy memo into plain language — currently only exists inside the product, per-case, behind login. That means it's invisible to search and to AI answer engines, which is exactly the content most likely to earn citations and organic traffic if it were public.

Build a public, indexable version — not the personalized per-case explanation, but the general knowledge-base content behind it (e.g., "USCIS's May 2026 I-485 memo, explained," written once, applying to everyone, not tied to any user's case). This is genuinely new surface area, not a re-skin of something that exists:

* A simple list + permalink pattern, same shape as /news and its /news/[id] permalinks already in this codebase — reuse that pattern rather than inventing a new one.
* Sourced from the same knowledge base already curated for the in-app explanations — this is a publishing step, not new research, though Peter should review each public post before it ships (same knowledge-base accuracy discipline as everywhere else in this project).
* Apply the direct-answer-block and schema treatment from items 3-4 to this new content too, from the start.

## 6. Path structure — build for a possible future merge without assuming it happens

For every new public path created in this round (the blog/knowledge-base permalinks in item 5, and any new anchors added to existing pages), use a clean, top-level path shape that would map cleanly onto casewhy.com/<path> if the domains ever merge (e.g., /blog/<slug>, not something nested under an app-specific route that wouldn't make sense on a marketing domain). Keep a running note in CLOUD_CLAUDE.md of every public path added this round and its domain, so a future redirect map (if the merge happens) is a lookup, not a fresh audit.

Not in scope this round: the actual domain merge, DNS changes, or redirect implementation — that stays Peter's own separate decision, unaffected by this round.

## Verify live

* site:casewhy.com and site:app.casewhy.com won't show results immediately (indexing takes time after submission) — verify instead that robots.txt, sitemap.xml, and page titles/descriptions are actually correct by direct inspection, not by re-running the site: search same-day.
* Fetch the acceptance-gate holding page directly (with the gate toggled on in a test/staging context if possible) and confirm it returns 503 or carries noindex — don't assume the fix worked without checking the actual response.
* Spot-check the new direct-answer blocks and schema markup render correctly and validate against Google's Rich Results Test.
* Confirm the new public knowledge-base content is reachable, indexable, and doesn't leak any per-user case data (same review discipline as /news).
* tsc/lint clean, production build succeeds on both casewhy.com and app.casewhy.com. Report back and fold into CLOUD_CLAUDE.md's standing status, including the running path-map note from item 6.
