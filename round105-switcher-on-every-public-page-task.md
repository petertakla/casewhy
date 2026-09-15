# New task for Claude Code — round 105: the language switcher on every public page (policy memos, updates, anonymous Ask), Spanish policy memos, and a CI check so no page ships without one

**Status: authorized now, Sep 15 (Peter: "the USCIS policy memos, explained does not have a switcher. check all pages to make the switcher consistent. This should have been done already"). Numbering: 101 done; 102–104 in Drive; per round 95 confirm 105 is free against** **CLOUD_CLAUDE.md** **and the tracker before building.**

## Audit (cloud session, live, Sep 15 — every PUBLIC_PAGES entry plus one dynamic page per type)

| Page | Switcher today | Cause |
| :-: | :-: | :-: |
| /dashboard, /ask, /settings, /processing-times, /visa-bulletin, /news | yes (?lang=es, round 82/83) | — |
| /plus, /get-help, six directories, /faq, /sitemap and their /es/* twins | yes (fixed routes, rounds 79/97) | — |
| /policy, /policy/[id] | no | built English-only in round 73; POLICY_MEMOS has no Spanish fields |
| /updates, /updates/[slug] | no | built English-only in round 93 |
| /get-help/ask | no | English-only; the hub above it is translated |
| /attorneys/join and the other five /join forms | no | English-only by design — applications from attorneys/organizations, not users |

Round 99 componentized the switcher only where one already existed; it did not add one where none existed. This round closes that, and adds the structural check round 99 should have had.

## What to build

### 1. /policy and /policy/[id] — locale-aware, with Spanish memo content

- Make both pages locale-aware on the round-82/83 same-route pattern (?lang=es + sticky cookie, isSpanishLocale() server-side), same as /news. Add them to LOCALE_AWARE_EN_PATHS / LOCALE_AWARE_EN_PREFIXES (or the round-101 hook's equivalent) so the header/footer agree with the body.
- Chrome: page titles, section headings, "Ask CaseWhy about this →", the sourcing block labels, BackLink text — translated, formal usted, appended to the round 81 manifest.
- Content: extend each POLICY_MEMOS entry with titleEs, summaryEs, bodyEs (same shape as the English fields). AI-draft the Spanish for all current memos in usted, from the English text and the cited USCIS source (not a blind translation — if the memo quotes a USCIS phrase, use USCIS's own Spanish wording where the source page has a Spanish version). Every new string goes to the manifest for native-speaker review, per round 81's decision. A memo with no bodyEs yet (future memos added in a hurry) renders the English body under the Spanish chrome with the standard "(en inglés)" tag on its list card — never a silent English page with Spanish chrome.
- FAQPage/BreadcrumbList JSON-LD on /policy/[id] renders in the active language. hreflang pairs on both.
- hrefEs in pages.ts for /policy becomes /policy?lang=es, matching /dashboard's convention, so the site index and footer link the Spanish version and drop the "(en inglés)" tag.

### 2. /updates and /updates/[slug] — locale-aware chrome; posts keep their own language

- Same locale-aware treatment for the chrome (title, intro line, "Share", "RSS feed", "No posts yet", the sourcing block, the round-103 preview banner).
- Posts have a lang frontmatter field already (round 93). The list in Spanish mode shows posts whose lang is es first, then English posts with the "(en inglés)" tag; a post permalink renders in its own language regardless of the chrome locale (a Spanish reader opening an English post sees Spanish chrome, English article, tag at the top). This is the same rule the round 91 language-sequencing section set for social: Spanish posts are written in Spanish, not translated — no bodyEs on posts.
- hrefEs for /updates → /updates?lang=es.

### 3. /get-help/ask — locale-aware

- Translate the page chrome and the instructional copy (the free-text box already accepts Spanish per round 83; confirm the AI answers in the language of the question). hrefEs → /get-help/ask?lang=es, and link it from /es/get-help where the English hub links /get-help/ask.

### 4. The six /join forms — explicit exemption, not an oversight

- Add switcherExempt: true with a one-line switcherExemptReason to those six entries in pages.ts ("Application form for attorneys/organizations; English-only by design"). The site index's Spanish view already tags them "(en inglés)"; keep that. If Peter later wants Spanish join forms, flipping the flag is the to-do, not a hunt.

### 5. CI check — a public page without a switcher fails the build

- scripts/check-language-switcher.ts, wired into .github/workflows/ci.yml next to validate-jsonld: for every PUBLIC_PAGES entry with an app-relative href and no switcherExempt, plus one representative dynamic URL per type (a memo id, a post slug, one listing per directory type — read from data, not hard-coded), render the route (Next's test renderer or a fetch against the preview deployment, whichever the existing CI already does) and assert the LanguageSwitcher markup is present. Fail with the offending path.
- Standing rule for CLOUD_CLAUDE.md, next to rounds 99 and 101: **every public page renders the language switcher or carries** **switcherExempt** **with a reason in** **pages.ts****; the CI check enforces it.**

## Out of scope

Spanish /join forms. Translating existing English /updates posts (Spanish posts are written natively when the round 91 Phase 2 starts). Any change to the switcher's placement (round 102 settles that) or the header (round 101).

## Verify live

- Every row in the audit table above shows a switcher (or is a flagged /join form); re-run the same fetch the cloud session ran: document.querySelectorAll('main a') filtered to Español/English on each URL — none missing.
- /policy?lang=es: Spanish chrome, Spanish memo titles/summaries; /policy/<id>?lang=es: Spanish body for a memo with bodyEs; JSON-LD in Spanish; switcher round-trips /policy/<id> ↔ /policy/<id>?lang=es.
- /updates?lang=es: Spanish chrome, English posts tagged "(en inglés)"; a post permalink keeps its own language.
- /get-help/ask?lang=es: Spanish chrome; a Spanish question gets a Spanish answer.
- Header and footer language agree with the body on all of the above (round 101 hook), including after the round-83 cookie-clearing regression check.
- Site index Spanish view: /policy, /updates, /get-help/ask no longer carry the "(en inglés)" tag; the six /join forms still do.
- CI: temporarily remove the switcher from one page on a branch → the check fails naming that path → restore.
- Manifest updated with every new string; tsc/lint/build clean; deployed; tracker last line → "106+ unclaimed". Report the memo count translated and anything left English with a reason.

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described, with one interpretation call: the task doc names the third memo field `bodyEs` while the actual `PolicyMemo` interface has `summary` + `currentStatus` (no `body`). Read "same shape as the English fields" as the controlling instruction and added `summaryEs` + `currentStatusEs` to mirror the real two-field shape, rather than inventing a `bodyEs` field with no English counterpart.

All 11 `POLICY_MEMOS` entries (not just "current" ones at the time of writing — every entry that existed) got Spanish content in this pass, so the "(en inglés)" fallback path exists in code but isn't currently exercised by any real memo.

Two real bugs found during the build/verify pass, not in the task doc:
1. `/updates/[slug]/page.tsx`'s `isSpanish` was gated behind `isPreview` (`isPreview && (await isSpanishLocale(...))`), so Spanish chrome only ever worked on an unpublished preview and silently reset to English the moment a post went live. Fixed to compute unconditionally.
2. The anonymous-chat court/removal deterministic guardrail (`COURT_REMOVAL_KEYWORDS`) was English-only. A live Spanish test question fell through to the model instead of the guaranteed redirect. Fixed with Spanish keyword equivalents, shipped as a same-day follow-up commit.

Verification gap, reported rather than glossed over: the Vercel bot-protection checkpoint (the same one round 103 diagnosed as unrelated to app code) started blocking further automated `curl` requests partway through this round's live-verification pass, and Claude in Chrome's browser tool did not respond across four separate attempts in this session. `/es/sitemap`'s tag removal and the admin preview banner's Spanish rendering were therefore verified by code inspection (the same `!entry.hrefEs` logic already confirmed live for `/dashboard`) rather than by a fresh screenshot — flagged explicitly in CLOUD_CLAUDE.md rather than claimed as directly observed.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 105" and its standing rule.
