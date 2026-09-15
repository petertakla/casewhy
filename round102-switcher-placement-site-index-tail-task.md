# New task for Claude Code — round 102: language switcher below the header on both sites, site-index tail cleanup, Site index out of the Resources menu

Status: authorized now, Sep 15 (Peter's direct reports after round 101 shipped). Revised same day: Peter reviewed the round-101 footer on his phone and wants it kept exactly as is — the earlier draft's "short footer labels" item is withdrawn (that draft, titled …-and-footer-labels-task, is trashed; this doc supersedes it). Numbering: 101 is done; per round 95 confirm 102 is free against CLOUD_CLAUDE.md and the tracker before building.

Three small items, all chrome/consistency. Do not touch SiteFooter or the footer labels. No schema, no legal text, no Terms/Privacy edits.

## 1. Language switcher: one placement on both domains — below the header, part of the page

Peter's decision (Sep 15): the switcher lives in the page body on every page that has a Spanish version, not in the header. The header menu stays clean.

Live today: app.casewhy.com renders the round-99 LanguageSwitcher right-aligned, ~40px below the header, mb-2, above the page's h1 — on all ~23 locale-aware pages. casewhy.com (static, main branch) puts Español in the header instead: on index.html it's the last item of the nav (How it works · Privacy · Join the waitlist · Get Help · Sign in · Español); on faq.html it's the only thing next to the logo (class="signin-link" inside .nav-group, which round 99 made byte-identical to index.html's pattern). So each site is consistent with itself and the two disagree.

- main branch, four files: index.html, faq.html, es/index.html, es/faq.html. Remove the Español/English link from the header .nav-group. Add it as the first element inside the page's main content container, right-aligned, same visual weight and position as the app's switcher (small text, muted, above the first heading, ~8px bottom margin). Same targets as today (index.html ↔ es/index.html, faq.html ↔ es/faq.html). hreflang tags unchanged.
- Give it one shared class (.lang-switch-inline) defined once in the shared stylesheet — not four inline copies. Verify all four pages render it identically (diff the markup block).
- privacy.html / terms.html have no Spanish versions — no switcher, as today.
- App side: nothing to change. The round-99 component is the reference implementation.

## 2. Site index (/sitemap, /es/sitemap) — fix the tail

Live today (screenshot in the cloud session, Sep 15): the "Looking for the machine-readable version? See sitemap.xml…" paragraph renders inside the Reference section directly under "Frequently asked questions", in body-size text, so it reads as a broken seventh list item; and the page's own bottom padding stacks on the footer's mt-16, leaving an oversized gap between the Legal section and the footer.

- Move the sitemap.xml note out of the Reference section to after the Legal section, as the last element of `<main>`: text-xs text-muted, one line. Spanish: "¿Busca la versión legible por máquina? Consulte sitemap.xml, que también incluye cada listado del directorio y cada permalink de memorando." Keep the link.
- Keep the Legal section on the index (the index should be complete on its own, even though the footer repeats those three links — Peter has seen the footer and wants it kept as is).
- Spacing: the gap between the last Legal link (now the note) and the footer's top border should equal the gap between sections — collapse the double margin, on this page only if that's simplest.

## 3. Resources menu: drop "Site index"

Peter: it's of little value in a pull-down; the footer is enough. Set showInHeaderMenu: false on the /sitemap entry. Menu becomes: Processing times · Visa bulletin · Immigration news · Policy memos · Updates · FAQ (six items). Nothing else in the menu changes.

## Verify live

- casewhy.com/, /faq.html, /es/, /es/faq.html: header has no language link; the switcher appears right-aligned above the first heading in the same spot on all four; clicking it lands on the matching page in the other language. curl each page and confirm the header .nav-group markup no longer contains the switcher and the new block is identical across the four files (one class, no inline styles).
- app.casewhy.com/get-help vs casewhy.com/: the switcher sits at visually the same offset below the header on both (screenshot both at 1280px and compare).
- /sitemap and /es/sitemap: the sitemap.xml note is the last line of `<main>`, small and muted, below Legal; Reference section ends at FAQ; single consistent gap before the footer.
- Footer: unchanged from round 101 (same ten links, same long labels) — verify nothing in the footer moved.
- Resources menu, signed in and out, EN and ES: six items, no Site index; Site index still in the footer.
- Static site validate-jsonld.mjs passes; app tsc/lint/build clean; deployed. Fold into CLOUD_CLAUDE.md referencing rounds 82, 99, 101; tracker last line → "103+ unclaimed".

## After shipping

Report done; the cloud session then updates the Marketing Operations manual's navigation section and screenshots in one pass for rounds 101 + 102 together.

---

## Claude Code build notes (Sep 15, 2026)

Built against the **first** draft of this task doc (which included a fourth item, "Footer: short labels") before the revision landed mid-build. Caught via a direct mid-turn message from Peter, not a self-initiated re-check this time — the tracker's own standing rule ("a task doc can change after Claude Code starts building it") applied for real: had already added `menuLabel`/`menuLabelEs` to the Get Help/Privacy/Terms/Contact registry entries and changed `SiteFooter.tsx` to prefer them. Reverted both (confirmed via `git diff` showing only the intended, in-scope changes) before anything was committed or pushed — no user-visible footer change ever shipped. Kept the `showInHeaderMenu: false` change on the `/sitemap` entry, since that's item 3 in both drafts.

The `PublicPage.tsx` double-margin fix (`py-10` → `pt-10`) was applied at the component level, not scoped to just `/sitemap`/`/es/sitemap` — the doc's "on this page only if that's simplest" phrasing allows either; a component-level fix is the same size change and also quietly fixes the identical latent issue on `/faq`/`/es/faq`, the other two `PublicPage` routes.

Verified live on both branches after deploy: `main` — `lang-switch-inline` present with correct hrefs/hreflang on all 4 pages, header `.nav-group` no longer contains a language link. `nextjs-app` — the sitemap.xml note is the last line of `<main>` on `/sitemap`, footer confirmed **unchanged** (same ten long labels, screenshotted against the live page), Resources menu confirmed at exactly six items with Site index absent.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 102."
