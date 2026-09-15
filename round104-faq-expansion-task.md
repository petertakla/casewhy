# New task for Claude Code — round 104: expand the FAQ from 5 legal questions to a real product FAQ (16 questions, grouped), on both domains, both languages

**Status: authorized now, Sep 15 (Peter: "the FAQ only has 5 questions but can use more relevant questions"). Numbering: 101 done; 102 and 103 in Drive; per round 95 confirm 104 is free against** **CLOUD_CLAUDE.md** **and the tracker before building.**

**Verification rule for this round (from round 97's own lesson): every number, limit, and behavior in the draft answers below is a claim to be checked against the source of truth — the round 50 pricing constants,** **DAILY_DRAFT_CAP**-style config, the round 63/71 cap code, the notification code, **privacy.html** **Section 2 — before it ships. Where the draft is wrong, fix the answer, not the code, and report the correction. Where a number is table-driven (tiers, prices, caps), render it from the constants on the app page so it can't drift; the static** **main** **copy is updated by hand and noted in** **CLOUD_CLAUDE.md** **as before.**

## Where the FAQ lives (all four must match)

- nextjs-app: src/app/faq/page.tsx (/faq) and /es/faq (round 97), with FAQPage JSON-LD.
- main: faq.html and es/faq.html (round 73/97/99), with hand-typed FAQPage JSON-LD validated by scripts/validate-jsonld.mjs.

## Structure

Group the questions under five headings (h2), in this order. The existing five answers stay word-for-word unless a fact changed; they move into their groups. New Spanish strings: formal *usted*, appended to the round 81 manifest.

(Full 16-question spec as originally drafted — see the Drive doc / CLOUD_CLAUDE.md Round 104 entry for the complete text of each question and answer.)

## Out of scope

Terms/Privacy wording (round 100's text is copied, not changed). New product behavior — if a draft answer describes something the product doesn't do, the answer changes, never the product. A search box on the FAQ.

## Verify live

- /faq, /es/faq, casewhy.com/faq.html, casewhy.com/es/faq.html: 16 questions in five groups, same order on all four; the language switcher round-trips to the matching page.
- Every number on the app page is rendered from constants (grep the page for hard-coded 9.99, three, ten → none in the tier/price answers).
- Report back the list of draft claims that were corrected during verification, so the cloud session can fix its own source docs.
- FAQPage JSON-LD validates on all four; manifest updated; tsc/lint/build clean on both branches; tracker last line → "105+ unclaimed".

---

## Claude Code build notes (Sep 15, 2026)

Shipped exactly as scoped, with three real corrections found during the mandatory verification pass — see `CLOUD_CLAUDE.md`, "Round 104" for the full detail on each:

1. **No "Report incorrect information" link exists on AI explanation pages** (that link is round 41's, for Get Help directory listings only). Rewrote to point at `corrections@casewhy.com`.
2. **Signed-in AI case explanations and the "Ask a question" chat are English-only**, even on a Spanish-language page — checked `explain.ts`/`chat.ts` directly, neither has a locale parameter. Only the anonymous Get Help chat is Spanish-aware. Rewrote the Spanish-availability answer to say so honestly instead of overclaiming, per this round's own "fix the answer, not the product" instruction.
3. **Subscription cancellation isn't on Settings** — `/settings` has no billing UI at all. The real "Manage subscription" link is on `/plus`. Corrected.

Everything else in the draft (tier caps, cron cadence, iOS push requirement, anonymous cap, Plus pricing, PDF report contents, and — checked with real doubt given a stale internal note — that CaseWhy LLC is a currently-registered Florida entity) was verified accurate as written.

All four pages live, 16 questions each, JSON-LD validated, 26 Spanish strings added to the round 81 manifest. Full writeup: `CLOUD_CLAUDE.md`, "Round 104."
