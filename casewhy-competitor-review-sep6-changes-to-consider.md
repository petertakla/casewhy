# Competitor Review, Sep 6, 2026 — "Changes to Consider"

**Status: reviewed and finalized — authorized to build.** Revision 5. Every item is now decided, including the case cap (item 1), which went through two passes: Peter first called for unlimited ("fully unlimited is the norm"), then on reflection agreed with the reselling-risk tradeoff below and settled on **keeping the original 5-case cap from CW-36** — no change there after all, just better marketing copy around it. Item 4's feed list was expanded from 6 to a top-10 shortlist on Sep 6 (later), after Peter asked for the fuller list before this went to Claude Code. This is being handed to Claude Code as round 14 in `CLOUD_CLAUDE.md`.

## The competitor

The screenshots are from **Case Tracker for USCIS & NVC** (ImmiVision) — confirmed by the "NVC Timeframes" notification toggle, distinctive among the three competitors already tracked in the "CaseWhy Competitive Comparison" artifact.

**Correction to the existing competitive record:** that artifact currently described this app as free-with-ads plus a paid *ad-removal* tier. These screenshots show something bigger — a real, feature-gated **$9.99/mo "Plus" subscription** (unlimited case tracking, a "USCIS Decision Date Analysis" feature, real-time updates, ad-free), not just ad removal. The artifact (`https://claude.ai/code/artifact/dfb67690-8235-4179-b4bb-def2e4748f54`) has since been corrected to match.

## 1. Case cap — decided: keep 5 (no change)

Two passes on this one. Peter first called for unlimited ("fully unlimited is the norm and should go by unlimited"), then, on reflection, agreed with the reselling-risk tradeoff flagged in this document and settled on **keeping the original 5-case cap from CW-36** — the number itself doesn't change, only the marketing copy might get sharper about how generous 5 actually is for a real household.

**Why the reversal held up:** the 5-case cap wasn't arbitrary — it was chosen deliberately (MVP scope doc, Section 6) specifically to be "sized to Peter's own household... rather than large enough to be informally resold/shared across an unrelated group, which would undercut the per-subscription pricing entirely." Going unlimited would have reopened exactly that risk: nothing would stop one $9.99/mo account from tracking cases for a large, unrelated group of people — a real economic threat to a flat-rate subscription (the same reasoning behind VisaWatch capping its own family tracking rather than making it unlimited, per the earlier competitive research). No technical change needed here — `TIER_LIMITS.plus.maxCases` in `src/lib/billing/tier.ts` stays at `5`.

## 2. The 3-month discount package — deferred, not blocking round 13

Peter's feedback: don't hold up round 13 deciding this now — let Claude Code build round 13's single-price billing as already scoped, and when the 3-month package is actually added later, have Claude Code report back what it costs (in effort) to retrofit onto the already-wired Checkout flow.

Reversing my earlier recommendation (I'd suggested deciding this before round 13 starts, to avoid rework) — going with Peter's call instead: **round 13 proceeds as already scoped, single price only.** The 3-month package becomes its own tracked follow-up item: when it's picked up, Claude Code should report the actual retrofit cost/effort as part of that work, not estimate it in advance.

## 3. Check attached for comparison

Done — this document is that comparison.

## 4. `/news` — general, not case-specific, with a proper feed-selection architecture

Peter's feedback had two parts: double-check where the competitor's USCIS-tagged headlines actually come from (since USCIS itself has no RSS feed, per the first pass of this research), and build the news feature so feed sources are easy to change, with users able to pick which feeds they want via checkboxes in Settings.

**On the USCIS-feed question — corrected, not just resolved.** My first-pass research concluded USCIS had no working RSS feed; that was wrong, or at least incomplete. Peter pointed directly at `uscis.gov/newsroom/all-news`, and digging further found the real thing: **`https://www.uscis.gov/news/rss-feed/59144`, USCIS's own "All News RSS Feed,"** confirmed genuine via Google's own search index (it's a real, crawled feed, not a dead or hypothetical link).

**One real caveat, not a reason to skip it:** a direct automated fetch of that URL returns a 403 — the same Cloudflare-style bot-blocking already documented elsewhere in this project for USCIS's processing-times tool and the visa bulletin source (both hand-refreshed for the same reason). Google's own crawler evidently gets through; a plain server-side fetch (what a scheduled news aggregator would use) likely doesn't, though that's worth actually testing (different request headers, a real browser fetch, etc.) before assuming it needs hand-refreshing the same way CW-33/34 do.

**Separately, the competitor's specific headlines (fee-adjustment notices, etc.) could also come through the Federal Register's own agency-filterable API/RSS** — confirmed live: `federalregister.gov/api/v1/documents.json?conditions[agencies][]=u-s-citizenship-and-immigration-services` returns real, current USCIS documents, and the Federal Register's USCIS agency page offers a genuine, officially-documented RSS option. Worth keeping as a second, definitely-not-blocked USCIS-adjacent source even now that the native feed is confirmed real, precisely because it doesn't share the Cloudflare issue.

**Expanded Sep 6 (later) to a top-10 shortlist, per Peter's request to see the fuller list before this goes to Claude Code.** Each of the following was actually fetched and confirmed live (not just found via search) — dead or stale feeds were dropped rather than listed on faith. A few reputable candidates were checked and cut for that reason: `fwd.us/feed/` 404s, and the National Immigration Forum's feed (`immigrationforum.org/feed/`, which now redirects to `forumtogether.org/feed/`) returned mostly stale/placeholder items (last real post December 2024). Center for Immigration Studies (`cis.org/blog/feed`) is a real, live feed but was left off deliberately — it's a restrictionist advocacy think tank, and pairing it with an otherwise-neutral shortlist would tilt the feed rather than inform it; the same call would apply to any single-issue advocacy blog arguing the opposite direction.

**The top 10, ranked roughly by authority/reliability for CaseWhy's audience (naturalization + family/employment green card cases):**

1. **USCIS's own "All News" feed** — `https://www.uscis.gov/news/rss-feed/59144`. Most authoritative possible source (the agency itself), but needs the fetch-blocking question resolved first (see caveat above) before it can be relied on as a live, automated source.
2. **Federal Register, filtered to USCIS** — `https://www.federalregister.gov/api/v1/documents.json?conditions[agencies][]=u-s-citizenship-and-immigration-services`. Official, confirmed unblocked, good fallback/complement to #1 for fee changes, rule changes, and formal notices.
3. **Federal Register, filtered to DHS** — same API, DHS-wide, catches immigration-adjacent notices that aren't filed under USCIS specifically (e.g., TPS designations, DHS-wide policy).
4. **The Insightful Immigration Blog (Cyrus D. Mehta)** — `https://blog.cyrusmehta.com/feed`. Confirmed live (Sep 5, 2026 post on a Maryland court blocking a birthright-citizenship rule; Aug 2026 posts on the 75-country visa ban and a BIA ruling). Widely cited, substantive legal analysis of court decisions and regulatory changes — the single best "what just happened and why it matters legally" source on this list.
5. **Murthy Law Firm Blog** — `https://www.murthy.com/feed/`. Confirmed live. One of the most established, widely-read immigration law firm blogs, especially strong on F-1/H-1B/employment-based process changes and practical FAQs — useful even for CaseWhy's non-employment-based users since USCIS process changes often apply system-wide.
6. **WR Immigration (Wolfsdorf Rosenthal) Blog** — `https://www.wolfsdorf.com/feed/`. Confirmed live (posts dated Sep 2-3, 2026, including a monthly "Global Immigration Recap"). Large, respected business-immigration firm; the recurring digest format is a good fit for a general news aggregator.
7. **Greenberg Traurig — Inside Business Immigration** — `https://www.gtlaw-insidebusinessimmigration.com/feed/`. Confirmed live (Sep 3, 2026 post specifically analyzing that month's Visa Bulletin; other posts on DOJ fraud-detection policy and TPS work-authorization rules). Big-law analysis with real depth, and directly complements CW-34's visa bulletin feature.
8. **Immigration Impact** — `https://immigrationimpact.com/feed/`. Confirmed working. The American Immigration Council's policy/advocacy blog — pairs well with the Federal Register sources by explaining what a given rule or court decision actually means for applicants, in plain language.
9. **CitizenPath** — `https://citizenpath.com/feed/`. Confirmed working. Consumer-facing (not attorney-facing) explainers, closest in tone/audience to CaseWhy's own users among all the sources checked.
10. **Visa Lawyer Blog (Jacob J. Sapochnick)** — `https://visalawyerblog.com/feed/`. Confirmed working. Consumer-oriented case-process commentary; don't confuse with the separately-run "H1B Visa Lawyer Blog" at a different domain.

**One more worth keeping in reserve, not in the initial 10:** **RedBus2US** (`https://redbus2us.com/feed/`, confirmed live, e.g. a July 17, 2026 H-1B FY2027 cap-reached alert) — a large, community-oriented site especially strong on H-1B/F-1 news, but its focus overlaps heavily with Murthy's and Wolfsdorf's employment-based coverage already on the list. Good candidate to swap in (or add as an 11th) if user feedback says the shortlist skews too litigation/policy-heavy and not enough day-to-day community news.

**Architecture, per Peter's spec — unchanged by the expansion to 10:** a `NEWS_SOURCES` config (same "small, hand-maintained, easy to edit" pattern already used for the representatives table and the knowledge base) listing each source's id, display name, and feed URL — trivial for Claude Code to add/remove/edit later, no schema change needed to change sources. A new user-preferences table stores which sources each user has checked on (default: all checked on for a new account, so the page isn't empty on day one). The Settings page (see item 6) renders one checkbox per source from that same config, so adding another source later automatically shows up as a new checkbox with no separate UI work. The `/news` page itself just aggregates whichever sources the signed-in user has checked; a signed-out visitor sees the full default set (this page should stay public/SEO-visible per the earlier discussion, not gated).

**Real open item for whoever builds this:** confirm whether USCIS's own feed (#1) can actually be fetched server-side at all before relying on it as a live source — if it's genuinely blocked the same way the processing-times tool is, it either needs the same manual-refresh treatment or gets dropped in favor of the Federal Register's USCIS feed (#2), which covers similar ground without the blocking problem. Everything else on the list (#2-10) was confirmed reachable by a direct fetch during this research, so none of the rest carry that same open question — though a real implementation should still re-verify each at build time, since a blog's feed can change or move.

## 5. Links/resources hub page — confirmed, good to go

No changes from the first pass.

## 6. Settings page — extended to include the links/resources hub (item 5) and the news feed checkboxes (item 4)

Peter's feedback: merge item 6 into item 5 rather than building two separate pages.

Revised shape: **one Settings/preferences page**, sectioned into (a) notification toggles (status changes, chat replies, etc.), (b) news feed source checkboxes (per item 4's architecture above), and (c) the links/resources hub from item 5 — either as a section on the same page, or as its own page linked prominently from Settings, whichever reads better once it's actually laid out. Leaving that exact layout call to whoever builds it rather than over-specifying now.

## The `/plus` page — separate note, not one of the six

Peter's feedback: each feature listed on the `/plus` marketing page (round 13's scope) should be a hyperlink to a fuller explanation of that feature and its value, not just a one-line bullet.

Good change, and it strengthens something already noted in the round-13 scope doc — deeper per-feature content also doubles as SEO landing-page material, the same content-marketing role the processing-time and visa-bulletin pages already play. Revised `/plus` spec: each feature (unlimited chat, 5-case family tracking, on-demand checks, document vault, the escalation toolkit's individual pieces) links to its own short explanation section or anchor with what it does and why it matters, rather than a flat bulleted list being the whole page.

## Summary — everything decided, ready for Claude Code

- **Item 1 (case cap):** no change — stays at 5, per CW-36. Marketing copy can lean into how generous that is for a real household rather than implying it's a limitation.
- **Item 1 (price, $9.99/mo):** hold, no change.
- **Item 2 (3-month discount):** deferred past round 13; when picked up later, Claude Code reports the retrofit cost as part of that work.
- **Item 3:** this document is the requested comparison.
- **Item 4/5/6 combined:** one Settings/preferences page (notification toggles + news-source checkboxes + the links/resources hub), and the `/news` page with its config-driven, user-selectable feed architecture, now backed by a **top-10 shortlist** (USCIS's own feed pending the fetch-blocking check, Federal Register ×2, Cyrus Mehta's Insightful Immigration Blog, Murthy Law Firm, WR Immigration/Wolfsdorf Rosenthal, Greenberg Traurig's business-immigration blog, Immigration Impact, CitizenPath, Visa Lawyer Blog) plus RedBus2US held in reserve as an 11th.
- **`/plus` page:** per-feature hyperlinks to fuller explanation/value sections instead of flat bullets.
- **Also done:** the competitive-comparison artifact correction (this competitor has a real feature-gated Plus tier, not just ad-removal) — already applied to the live artifact.
