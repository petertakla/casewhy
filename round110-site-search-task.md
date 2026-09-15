# New task for Claude Code — round 110: site-wide search — header icon + ⌘K overlay, grouped results across content and directories, "Ask CaseWhy" as the fallback, search box in the Resources menu and on the FAQ

**Status: authorized now, Sep 15 (Peter: "introduce a Search function for the Resources menu at least… open for suggestions" → approved the full site-wide version: "write up and go all the way"). Revised same day: Section 6 (Spanish) added explicitly; Get Help results sub-grouped by entity type.**

(Full spec — the index, the directory endpoint, the overlay, the FAQ page search box, measurement, Spanish handling, and the standing rule — see the Drive doc / CLOUD_CLAUDE.md's Round 110 entry for the complete original text.)

## Out of scope

Searching inside a user's own case data. Any inline AI-generated answers in the overlay. A third-party search service. Searching admin pages.

## Verify live

- Header: icon present signed in and out, desktop and 390px; ⌘K opens the overlay from /dashboard, /faq, /policy/<id>; Resources menu box opens it pre-filled.
- Queries, each returning something sensible in the right group: "case was received", "I-485", "priority date", "attorney florida", "legal aid", "cancel", "site index".
- Spanish chrome: "boletin", "abogado florida", "caso recibido", an English-only post tagged "(en inglés)".
- Ask row → /get-help/ask?q=… pre-fills without submitting.
- Keyboard-only walkthrough; index size logged and guard tested; search_events with no PII; /admin/search registered.

---

## Claude Code build notes (Sep 15, 2026)

Shipped in full — header icon, ⌘K, Resources menu box, content index (MiniSearch, 381 EN / 376 ES docs, ~81 KB each, well under the 400 KB guard), the directory endpoint over all six Get Help tables sub-grouped by entity type, the FAQ page's own search box, `search_events` logging, and `/admin/search`.

**Two claims in the task doc pointed at infrastructure that doesn't exist in this codebase**, found before building on top of them: "reusing round 35's StateFilter query logic" — `StateFilter.tsx` is a pure client-side filter over an already-loaded array, no DB query exists to reuse. "Rate-limited like the other public endpoints" — the one existing usage cap in this codebase is a lifetime AI-question cap (a different mechanism), not a reusable rate limiter. Built both from scratch for this round.

**A real bug caught by the task doc's own verify-live example**: "attorney florida" returned zero results at first, since "attorney" doesn't literally appear in an attorney's name. Fixed by stripping each entity type's own keywords and detected state names from the query before building that type's search term — confirmed live afterward, exactly matching the expected result.

**A real anchor-id mismatch and a real data-mapping bug**, both caught by testing rather than assumed correct: the build script was slugifying the FAQ question in English for both locales, which wouldn't match the Spanish page's own Spanish-text-derived anchor id; and `legal_aid_directory`'s city column was wired to `null` even though the table has one.

**Section 6 (Spanish) implemented literally**: every indexed doc carries its own real `locale`, independent of which JSON file it's in — content with no real Spanish translation (processing-time category labels, visa-bulletin row labels — verified no `labelEs`/`categoryLabelEs` field exists on either, not assumed) is tagged `locale: "en"` within the Spanish index and shown with "(en inglés)," never silently dropped or machine-translated.

Verified live in production: header icon, full overlay (content + directory results, correct grouping, correct "See all N →" links), the FAQ page's own scoped search box, Spanish diacritic folding ("boletin" → Boletín de visas), and `/admin/search` showing a real logged event end-to-end. Full writeup: `CLOUD_CLAUDE.md`, "Round 110."
