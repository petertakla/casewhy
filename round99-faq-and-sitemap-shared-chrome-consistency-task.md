# New task for Claude Code — round 99: FAQ and site-index pages use the shared language switcher and footer; site index rendered from one public-page registry; standing rule so no page gets its own chrome again

**Status: authorized now, Sep 15 (Peter's direct reports: "the ES location on the FAQ is not consistent with the rest … and bottom menu is not either", then a site-index audit). Numbering: 98 is in progress; per round 95, confirm 99 is free against `CLOUD_CLAUDE.md` before building.**

## What's wrong (read from the repo, Sep 15)

- `src/app/faq/page.tsx` and `src/app/sitemap/page.tsx` each render a **hand-placed** `<Link href="/es/…">Español</Link>` right-aligned above the `<h1>` — not the round-82 language switcher that `/plus`, `/get-help`, and the entity pages use, and not in its position. The `/es/` twins presumably mirror this.
- Neither page carries the bottom navigation the other public pages have; the FAQ ends in a one-off "See the site index or email hello@" line, the site index in a one-off "machine-readable version" line. On the static site, `faq.html` / `es/faq.html` footers don't match `index.html` / `es/index.html`.
- **Site index, real bug:** the "app.casewhy.com — sign in / track a case" entry links to `/`, which has been a 308 redirect to casewhy.com since round 74 — it bounces the visitor off the app.
- **Site index, structural:** `SECTIONS` is a hand-maintained array. Every new public page (round 93's `/updates`, round 97's `/es/faq`, `/es/sitemap`) needs someone to remember to add it — the same orphaning mechanism round 98's registry fixed for `/admin/*`. `sitemap.ts` maintains its own separate list of the same pages.
- Site index legal links go to `casewhy.com/privacy.html` and `/terms.html`, which 308 to `www.` — an extra hop on every click. No contact entry.
- Page widths differ (`/faq` `max-w-2xl`, `/sitemap` `max-w-3xl`, admin `max-w-3xl`/`4xl`) — symptom of no shared public-page shell.

## What to build

1. **Public-page registry.** `src/lib/site/pages.ts`: one array of every public page — `{ href, label, labelEs, section, hrefEs?, external?, showInIndex, showInFooter, showInSitemapXml }`. Render **all three** from it: the human site index (`/sitemap` and `/es/sitemap`), `sitemap.ts`'s static-path list (DB-backed entity slugs stay as they are), and the shared footer (item 3). Spanish pages get their own entries or an `hrefEs`; the Spanish index links Spanish targets and tags "(en inglés)" where `hrefEs` is absent — exactly round 97's behavior, now data-driven.
2. **Language switcher.** Replace the page-local link on `/faq`, `/es/faq`, `/sitemap`, `/es/sitemap` with the round-82 switcher component in its standard position. If round 82 inlined it per page, extract `src/components/LanguageSwitcher.tsx` and use it everywhere it's inlined. Keep the matching-page round-trip and the `?lang=` cookie handling `AuthHeader.tsx` documents.
3. **Shared footer.** If the app has no footer component (round 93/97 found none), build a small `src/components/SiteFooter.tsx` rendered from the registry's `showInFooter` entries (Get Help · Processing times · Visa bulletin · Policy · Updates · FAQ · Site index · Privacy · Terms · Contact), locale-aware, and mount it in the app's public layout so every public page gets it — including FAQ and site index, which drop their one-off closing lines. On the static site, make `faq.html` / `es/faq.html` footers byte-identical to `index.html` / `es/index.html` (extract to a partial if the static build has any include mechanism; otherwise copy and note the duplication).
4. **Site-index fixes** (via the registry): `/` entry → `/dashboard` labeled "Dashboard — track a case (sign in)"; legal links → `https://www.casewhy.com/privacy.html` and `/terms.html`; add "Contact — hello@casewhy.com"; keep the sitemap.xml note as the last item under Reference rather than a loose paragraph.
5. **Shared public-page shell.** One `PublicPage` wrapper (or a layout) that fixes the content width (pick `max-w-3xl`, the majority) and mounts the switcher at the top and footer at the bottom; use it on `/faq`, `/sitemap`, and their Spanish twins now, and note which other public pages still set their own width for a later sweep — don't sweep them in this round.
6. **Audit once.** `grep -rn "Español\|hrefLang=\"es\"" src/app --include=page.tsx` — fix every page-local language link found, in this round.
7. **Standing rule — add to `CLOUD_CLAUDE.md` next to rounds 88, 95 and 98:**

   > **Every public page is registered in `src/lib/site/pages.ts` and uses the shared shell, language switcher, and footer — never a page-local link, switcher, footer, or width.** A public page that isn't in the registry, or carries its own version of any of these, is not done. The site index, `sitemap.ts`, and the footer all render from the registry; nothing else lists public pages by hand.

## Verify live

- `/faq`, `/es/faq`, `/sitemap`, `/es/sitemap`: switcher position and style identical to `/plus`; round-trips both directions; shared footer present; no one-off closing lines.
- Site index: the dashboard entry lands on `/dashboard` (or the sign-in page when signed out), never on casewhy.com; legal links resolve without a redirect hop (check the response chain, not just the destination); Contact present; `/es/sitemap` still shows "(en inglés)" only where no Spanish page exists.
- `sitemap.xml` static paths equal the registry's `showInSitemapXml` set (diff them); no page that was in the old list is missing.
- Static `faq.html` and `index.html` footers diff clean; same for `es/`.
- Grep in item 6 returns nothing. tsc/lint clean, `validate:jsonld` clean, production build succeeds on both branches. Fold into `CLOUD_CLAUDE.md` referencing rounds 73, 74, 78, 82, 93, 97, 98.

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described. One real correction to the literal task text, made after actually reading every locale-aware page rather than trusting `/plus` as "the standard": `/plus` itself used `mb-6` spacing, but 17+ other pages used `mb-2` — the real majority, and what `LanguageSwitcher.tsx` standardizes on. Item 6's grep audit was applied to all ~23 locale-aware pages found, not narrowly to the four item 2 named, since the instruction ("fix every one found, in this round") was explicit and the fix was safely mechanical everywhere it applied.

Full build/bug/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 99."
