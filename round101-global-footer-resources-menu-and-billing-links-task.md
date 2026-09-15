# New task for Claude Code — round 101: footer on every public page, a "Resources" menu in the header, and Stripe billing links in the admin registry

Status: authorized now, Sep 15 (Peter's direct report: "there is no navigation link for /updates … same with coupons"). Numbering: CLOUD_CLAUDE.md tops out at round 100 and the tracker's last line says 101+ is unclaimed as of Sep 15 — per round 95, re-confirm before building.

## What the cloud session found live (Sep 15, app.casewhy.com, signed in as admin)

| Surface | /updates reachable? | Why |
| :-: | :-: | :-: |
| casewhy.com static site | yes — footer has Updates, FAQ, Site Index | fine, nothing to do |
| /faq, /sitemap (+ /es/*) | yes — round 99 footer | the only pages mounted in PublicPage |
| /get-help, /policy, /processing-times, /news, /plus, /updates itself, /dashboard | no — no \<footer\> element at all | round 99 scoped the footer to FAQ/sitemap; every other page has no footer |
| Signed-in header (AuthHeader.tsx NAV_LINKS) | no — Dashboard · Ask · Plus · Get Help · Processing times · Visa bulletin · News · Settings · Admin | no Updates, Policy, FAQ or Site index |
| Signed-out header | no — Get Help · Sign in | same |
| Admin shell | no way to reach coupons/promo codes | round 50 put coupons in Stripe's dashboard by design; nothing in nav.ts points there |

Root cause is the same shape round 98 fixed for /admin: the chrome that reads the registry is included page by page, so a page that forgets it (or predates it) is orphaned. The round-99 standing rule guarantees *registration* in pages.ts; nothing guarantees *rendering*. This round moves rendering into the root layout so the rule is enforced by structure.

## What to build

### 1. SiteFooter mounted once, in src/app/layout.tsx

- Mount `<SiteFooter />` in the root layout after `{children}`, wrapped in the same `mx-auto max-w-3xl px-6` container the header uses, so it aligns with the header on every page regardless of the page's own width. Remove it from PublicPage.tsx (keep PublicPage for the width + switcher — that part of round 99 stands).
- Because there is no public route group (round 99's own note), the footer decides by pathname. Add to src/lib/site/pages.ts (client-safe, like nav.ts):

```
/** Paths whose own shell replaces the site footer. Prefix match. */
export const NO_SITE_FOOTER_PREFIXES = ["/admin", "/auth"];
export function showSiteFooter(pathname: string): boolean
```

/admin/* has the round 98 shell; /auth/* is the sign-in flow and stays chrome-free. **Everything else gets the footer — including /dashboard, /ask, /settings and /plus.** Don't add pages to the exclusion list without a reason written next to them.

- Locale: SiteFooter currently takes `es` as a prop. The layout doesn't know the locale, and AuthHeader already computes isSpanish from /es/* path, ?lang=, and the round-83 cookie. Extract that computation into one hook (src/lib/i18n/use-is-spanish.ts, client) used by **both** AuthHeader and SiteFooter, so the two can never disagree (the exact race round 98 hit between the header and the admin shell). SiteFooter becomes a client component that calls usePathname() + the hook; it renders nothing when showSiteFooter(pathname) is false.
- The hook must preserve round 83's cookie-clearing semantics exactly — move the logic, don't rewrite it. LOCALE_AWARE_EN_PATHS / LOCALE_AWARE_EN_PREFIXES move with it.

### 2. Header: a "Resources" menu, built from the registry

The signed-in nav is nine items and horizontally scrolls on phones (round 71's fade masks). Adding a tenth is the wrong fix. Replace the four reference links with one menu:

- Signed in: **Dashboard · Ask a question · CaseWhy Plus · Get Help · Resources ▾ · Settings · Admin** (Admin still gated as in round 98).
- Signed out: **Get Help · Resources ▾ · Sign in**.
- Resources contents come from PUBLIC_PAGES, not a second hand list: add `showInHeaderMenu: boolean` to PublicPageEntry and set it true on Processing times, Visa bulletin, Immigration news, Policy memos, **Updates**, FAQ, Site index — in that order (registry order is display order, same convention as nav.ts). Use short menu labels: add an optional `menuLabel` / `menuLabelEs` (e.g. "Updates" / "Actualizaciones", "Policy memos" / "Memorandos de política", "Site index" / "Índice del sitio") falling back to label.
- Spanish: menu title **Recursos**. Item hrefs use hrefEs when present (/es/faq, /es/sitemap), else the English href — and retire the hand-maintained ES_HREF map in AuthHeader in favor of a registry lookup so /get-help and /plus come from the same source.
- Behavior: a button with `aria-haspopup="menu"` / `aria-expanded`, opens on click (not hover — must work on touch), closes on Escape, outside click, and route change; arrow keys move between items; the Resources trigger shows the active underline when pathname starts with any item's href. Reuse existing Tailwind tokens (bg-surface, border-border, text-muted) — no new design system. On the narrow layout the menu can render as a simple block under the trigger; it does not need to be a floating popover on phones.
- NAV_LINKS keeps only the five app links; the reference set is gone from it. Append the new strings to the round 81 Spanish manifest.

### 3. Admin registry: a "Billing" group pointing to Stripe

Round 50 deliberately has no CaseWhy coupon UI — Stripe's dashboard is the UI. Make it reachable from the admin shell so nobody has to remember that:

- AdminNavEntry gains `external?: boolean` (opens in a new tab, `rel="noopener noreferrer"`, an external-link glyph after the label; the shell never treats it as the current page and findAdminNavEntry ignores external entries so breadcrumbs can't match them).
- Group union becomes `"Marketing" | "Mail" | "Outreach" | "Billing"`; ADMIN_NAV_GROUPS appends "Billing" last.
- Entries:
  - `https://dashboard.stripe.com/coupons` — **Coupons & promo codes (Stripe)** / *Cupones y códigos promocionales (Stripe)* — "100%-off codes for internal testers and partner comps; created in Stripe, redeemed at checkout (round 50)."
  - `https://dashboard.stripe.com/subscriptions` — **Subscriptions (Stripe)** / *Suscripciones (Stripe)* — "Every Plus subscription, its status, and the customer portal history."
- Same entries appear as cards on /admin (index) with the external glyph. No pending counts.

### 4. Standing rule — add to CLOUD_CLAUDE.md next to rounds 88, 95, 98, 99

**Site chrome renders from the root layout only.** The header (AuthHeader) and footer (SiteFooter) are mounted once in src/app/layout.tsx and read src/lib/site/pages.ts; no page mounts, imports, or hand-writes its own header, footer, or navigation list. A page that needs to *suppress* the footer adds its prefix to NO_SITE_FOOTER_PREFIXES with a reason. Header menu membership is `showInHeaderMenu` in the registry, never an edit to AuthHeader. (Extends round 99's rule from "registered" to "rendered".)

## Out of scope

Restructuring src/app/ into route groups (round 99 judged that a larger sweep — still true). Redesigning the header beyond the menu. The static site (main) — already correct. Any change to /admin/marketing content.

## Verify live

- Every entry in PUBLIC_PAGES with an app-relative href, opened live: `<footer>` present with the same 10 links round 99 verified, aligned to the header's width. Also present on /dashboard, /ask, /settings, /plus, /updates, /updates/\<a-post\>, /policy/\<a-memo\>, /attorneys/\<a-listing\>. Absent on /admin, /admin/marketing, /auth/sign-in.
- `grep -rn "SiteFooter" src/app --include=*.tsx` returns only layout.tsx.
- Signed in on /dashboard: header shows the seven items above; Resources opens on click and tap, lists the seven registry items in order with **Updates** present, Escape and outside-click close it, arrow keys move focus, and the trigger is underlined while on /updates or /faq. Signed out on /get-help: Get Help · Resources · Sign in.
- /es/faq and /dashboard?lang=es: menu reads **Recursos**, items in Spanish, FAQ and Site index link to /es/faq and /es/sitemap; the header and footer show the same language on every page tested (the shared hook).
- /admin: a Billing group with the two Stripe cards; sidebar shows them with the external glyph; clicking opens Stripe in a new tab; breadcrumb on any admin page never shows a Billing entry.
- Round 83 regression check: set the Spanish cookie, visit /policy (English-only) → header and footer both English; visit /dashboard with no ?lang → both stay Spanish.
- tsc/lint clean, production build succeeds, deployed. Fold into CLOUD_CLAUDE.md referencing rounds 71, 80, 82, 83, 98, 99; update the tracker's last line to "102+ unclaimed".

## After shipping

Report the final menu labels (EN/ES) so the cloud session can update the Marketing Operations manual's navigation section and the FAQ/site-index screenshots.

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described. Two real findings along the way, not assumed from the task doc:

1. **A real technical constraint the task doc didn't anticipate:** the Resources trigger normally sits inside AuthHeader's `overflow-x-auto` scrollable nav row (round 71's fade-mask affordance). An ancestor with `overflow-x` set to anything but `visible` forces the browser to compute `overflow-y: auto` too, which would clip a same-ancestor dropdown to that scroll container's own single-line height. Solved with a React portal into `document.body`, positioned from the trigger's bounding rect at open time, closing on Escape/outside-click/route-change/ancestor-scroll — the standard pattern for a dropdown whose trigger lives inside a clipping/scrolling ancestor.
2. **`git status` caught a real near-miss before it became a real regression:** `src/lib/i18n/use-is-spanish.ts` already existed — a narrower hook built specifically for the four `/auth/*` pages, with its own real, already-shipped bug-fix history ("auth pages ignored the sticky Spanish cookie entirely"), undocumented in CLOUD_CLAUDE.md. Overwriting it without checking would have silently regressed a real, already-fixed bug. Verified live before proceeding that the new, more complete hook (built for AuthHeader/SiteFooter, per this task's own spec) still serves the four auth pages correctly — with the Spanish cookie set, `/auth/sign-in` and `/auth/sign-up` both render fully in Spanish, matching the original fix's exact scenario.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 101" and its standing rule.
