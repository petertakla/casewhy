# New task for Claude Code — round 84: internal linking audit, search-verification hook, and partner backlink outreach draft

Status: authorized now, Sep 13. Three related SEO follow-ups, bundled because none needs its own round: an internal-linking gap check (fully code-doable), a placeholder for Search Console/Bing site-verification codes (ready the moment Peter has one, not something Code can obtain itself), and a drafted (not sent) partner backlink outreach email reusing the existing approval-queue pattern.

## 1. Internal linking audit — the real, code-doable piece

Confirm the homepage and other major public pages actually cross-link to each other. Specifically check and fix any gaps:

  - Does casewhy.com's homepage link to /get-help, /processing-times, /visa-bulletin, /faq, and the policy library (/policy, if round 73 shipped it)? Round 73 built the site index (item 7) as one consolidated links page, but the homepage itself linking directly to the highest-value pages (not just via the index) matters for both crawl discovery and internal link equity — check whether that's already true or just assumed.
  - Does /get-help link to each of its six entity-type pages directly, not just via the chooser flow?
  - Does /processing-times link to /visa-bulletin and vice versa, where relevant (both are USCIS-timing content, a natural cross-link)?
  - Does the FAQ page (round 73 item 8) link out to the specific pages its answers reference, rather than just stating facts in isolation?

Fix any gap found by adding real, contextual links — not a generic "see also" dump at the bottom of every page.

## 2. Search Console / Bing Webmaster verification hook

Peter needs to start verification himself in Google Search Console and Bing Webmaster Tools (both are free, account-level actions Code has no access to) — this isn't something this round can do. What this round should do: add a simple, documented way to drop in a verification meta tag or DNS TXT value on both casewhy.com and app.casewhy.com the moment Peter has one from either service, without needing a further code round to wire it in. A placeholder meta tag slot (commented out, clearly labeled) in each site's <head> is enough — this is prep work, not a functioning verification by itself.

## 3. Partner backlink outreach — draft and queue, not send

Draft, don't send. Every attorney, legal aid org, accredited rep, and DSO already contacted for Get Help directory listings has a real reason to link back to their own listing page — free exposure for them, a real backlink for CaseWhy. Draft a short, genuine outreach email template (not templated-sounding — reference their actual listing) and reuse the existing pending-approval queue pattern (round 70/82) so each drafted email sits for Peter's review before anything goes out.

Real blocker, not optional: this can't actually send yet — the CAN-SPAM footer needs the LLC's real registered mailing address, still pending from Peter pulling it off the Northwest Registered Agent formation documents (same blocker flagged on the attorney-email-campaign concept). Build the draft/queue mechanism now; the send step waits on that address regardless of how ready the drafts are.

## Verify live

Confirm each internal-linking fix actually renders correctly and links resolve (no dead links introduced). Confirm the verification-tag placeholders exist, are clearly commented, and don't affect anything until a real value is dropped in. Confirm the backlink-outreach drafts land in the approval queue correctly and that nothing sends automatically — same hard requirement as every other use of this queue pattern. tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing rounds 70, 73, and 82.
