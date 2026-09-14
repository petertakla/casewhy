# New task for Claude Code — round 97: FAQ accuracy audit + Get Help wording + Spanish FAQ and site map with language selector

**Status: authorized now, Sep 14 (Peter's direct request, expanded same day with items 2–4). Numbering: the Round Status Tracker's last line reads "Round 97+ is unclaimed" as of Sep 14; the cloud session could not read `CLOUD_CLAUDE.md` at the time of writing (Peter's machine was offline) — per round 95, confirm 97 is free against `CLOUD_CLAUDE.md` before building, and renumber with a note if it isn't.**

Four items. Items 1–2 are content-only; items 3–4 extend the round 78–83 Spanish/i18n work to two pages it skipped. No schema/DB impact, no legal-review gate (Terms/Privacy untouched).

## 1. Audit every FAQ answer against the current free and Plus tiers — not just the one Peter spotted

Both FAQ pages — `casewhy.com/faq.html` (`main`, static) and `app.casewhy.com/faq` (`nextjs-app`, `src/app/faq/page.tsx`) — say the free tier includes **"one tracked case."** Round 47 raised that to 3. Fix it, but treat it as a symptom: **check every factual claim on the FAQ against the live tier definitions** (round 50's table-driven pricing constants and the Sep 10 user manual's Appendix A):

| Fact | Current value (user manual, Sep 10 — verify against the pricing table, which wins) |
|---|---|
| Tracked cases, Free | 3 |
| Tracked cases, Plus | 10 auto-approved, 11–25 pending review, 25 hard ceiling |
| AI chat about your case | 3/month Free, unlimited Plus |
| Anonymous Ask CaseWhy | 3 per IP per day, every tier |
| On-demand "Check now" | Plus only |
| Document vault | Plus only |
| Attorney-handoff PDF | Plus only |
| Stalled-case alert | every tier |
| Escalation letter drafting | Plus only |
| Get Help directories, Processing Times, Visa Bulletin, News | free, every tier, no sign-in |

Anything the FAQ states that disagrees with the table gets corrected; anything it should state and doesn't (e.g., the free tier's three AI questions a month) is worth one clause, not a new question. Prefer rendering numbers from the pricing constants on the app page so this can't drift again; note in `CLOUD_CLAUDE.md` that the static `main` copy must be updated by hand whenever the pricing table changes.

**Exact replacement for the first two sentences of "Is CaseWhy really free?":**

> CaseWhy has a free tier — up to three tracked cases, a status timeline, AI-generated plain-language explanations, and three AI questions about your case each month — plus an optional paid Plus tier for tracking more cases, unlimited questions, and other add-ons (see the [Plus page](https://app.casewhy.com/plus) for current pricing). **Get Help** — free legal aid, accredited representatives, attorneys, and more, all in one place — is free to everyone, always, regardless of subscription: no fees, no ads, no hidden cost.

Also grep both codebases for any other user-facing "one tracked case", "1 tracked case", "a single case", "one case" and fix.

## 2. Get Help wording

The Get Help phrase must match the round-51 share-text ordering everywhere it appears: **free legal aid → accredited representatives → attorneys → and more.** The FAQ (written in round 73, after 49/51) currently leads with attorneys. Fix it as in the sentence above and grep for any other instance that still leads with "attorneys."

## 3. Spanish FAQ on both domains, with the language selector

Rounds 78–83 translated the landing page, `/plus`, Get Help, auth, the app shell, and (round 83) processing-times/visa-bulletin/news SEO — the FAQ was built in round 73 and never got a Spanish version.

- `main`: add `es/faq.html` alongside `es/index.html`, same static pattern; link it from `es/index.html`'s footer where the English footer links `faq.html`.
- `nextjs-app`: add the `/es/faq` route via the existing next-intl setup (round 79's convention); the FAQPage JSON-LD must render in Spanish on the Spanish page.
- **Language selector:** the round 82 language switcher must appear on both FAQ pages (English and Spanish, both domains) exactly as it does on the other localized pages — same component, same placement. Check the switcher preserves the page (`/faq` ↔ `/es/faq`, `faq.html` ↔ `es/faq.html`), not just the locale.
- `hreflang` tags on both language versions (same requirement as round 78).
- Translation: AI-drafted, formal *usted* register per round 81's decision, and **append every new string to the Spanish strings manifest** (round 81's CSV) so it reaches native-speaker review. The Get Help ordering in Spanish: "asistencia legal gratuita, representantes acreditados, abogados y más".
- Sitemap: add both Spanish FAQ URLs to the respective `sitemap.xml`.

## 4. Spanish site map (the human-facing `/sitemap` index page), with the language selector

Round 73 item 7 built `app.casewhy.com/sitemap` — a human-readable index of every public area. It's English-only and has no language switcher.

- Add `/es/sitemap` via next-intl, translating the section headings and link labels, and pointing each link at the Spanish version of the target page where one exists (`/es/get-help`, `/es/plus`, `/es/faq`, `/es/processing-times`, etc.) and at the English page where no Spanish version exists yet — mark those with a short "(en inglés)" tag rather than silently linking to English.
- Language selector on both `/sitemap` and `/es/sitemap`, preserving the page across the switch.
- `hreflang` on both; add `/es/sitemap` to `sitemap.xml`.
- Link `/es/sitemap` from the Spanish footers (`es/index.html` on `main`, the Spanish app footer) where the English footers link `/sitemap`.
- Same strings-manifest append as item 3.

If the round 73 merge-proofing path table in `CLOUD_CLAUDE.md` is still being maintained, add `/es/faq` and `/es/sitemap` to it.

## Verify live

- Both English FAQ pages show "up to three tracked cases," the three-questions clause, and the reordered Get Help sentence; every other FAQ claim matches the pricing table.
- `grep -ri "one tracked case"` across `main` and `nextjs-app` returns nothing user-facing.
- `casewhy.com/es/faq.html` and `app.casewhy.com/es/faq` render fully in Spanish; the language switcher on each of the four FAQ URLs lands on the matching page in the other language.
- `app.casewhy.com/es/sitemap` renders in Spanish with correct Spanish targets and "(en inglés)" tags where applicable; switcher works both ways.
- `hreflang` present on all four new pages; all four appear in the relevant `sitemap.xml`.
- FAQPage JSON-LD validates on `/faq` and `/es/faq` (Rich Results Test).
- New Spanish strings appear in the round 81 manifest.
- tsc/lint clean, production build succeeds on both branches. Fold into `CLOUD_CLAUDE.md` referencing rounds 47, 49, 50, 51, 73, 78–83.

---

## Claude Code build notes (Sep 14, 2026)

Shipped as described. One real correction to the task doc's own table, caught by checking source rather than trusting the doc: **"Anonymous Ask CaseWhy | 3 per IP per day" is wrong** — the real design (`src/lib/get-help/anonymous-usage.ts`, `LIFETIME_CAP_PER_IP = 3`) is a non-resetting **lifetime** cap per IP, not a daily one (round 71 deliberately replaced a resetting daily window with this, because a resetting cap was a better deal for a signed-out visitor than a signed-in free account's monthly cap — backwards from the intended nudge). This row was never actually surfaced in the live FAQ either way, so no visible copy needed correcting for it — noted here so the table itself isn't propagated wrong into anything future.

One scope note on item 4: "link `/es/sitemap`... from the Spanish app footer" doesn't apply — `app.casewhy.com` has no footer component anywhere in the app (confirmed by direct search). Only `es/index.html`'s real static-site footer was updated.

Full writeup, what was verified live, and the exact grep results: see `CLOUD_CLAUDE.md`, "Round 97."
