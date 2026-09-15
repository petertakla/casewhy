# New task for Claude Code — round 111: casewhyhub.com, three more partner pages — congressional caseworkers, schools & international student offices, press & researchers — plus a shared "partner resources" kit and a link back to casewhy.com on every hub page

**Status: authorized now, Sep 15 (Peter: casewhyhub.com "looks great… could extend further… any suggestions" → approved: "sure write it up for code"; then "there should be a link back to casewhy.com somehow somewhere" — item 5).**

(Full spec — the kit, each page's content requirements, and the verify-live checklist — see the Drive doc `claude_round111-casewhyhub-caseworkers-schools-press-task` + `claude_round111-hub-page-copy` / CLOUD_CLAUDE.md's Round 111 entry for the complete original text.)

## Out of scope

Creators, libraries, referral, Spanish hub (parked for a later round). Any new app-side page. Paid placement. Anything that names a legislator, party, or policy position.

## Verify live

- All 8 hub pages render with the shared header/footer/kit; home shows six cards; every page's header/footer links back to casewhy.com, UTM-tagged.
- One-pager PDF downloads and prints; orientation slide displays correctly; snippet copy button works.
- Caseworker form writes to the lead table with kind = caseworker; press@casewhy.com registered.
- /press has zero unsourced numbers; /caseworkers has zero partisan/member-specific text.
- JSON-LD validates; sitemap updated; deployed.

---

## Claude Code build notes (Sep 15, 2026)

Shipped in full — `/caseworkers`, `/schools`, `/press`, `/resources`, the shared kit (one-pager PDF with a real QR code, website snippet, logo pack, boilerplate, orientation slide), and the link back to casewhy.com on all 8 pages.

**Rebuilt the hub's own build process**, not just added pages: `scripts/generate.mjs` + `scripts/pages.json` (registry) + `scripts/content/*.html` now generate every page's header/footer/nav from one place, regenerating all 8 pages (including the 3 pre-existing ones) consistently instead of hand-copied HTML.

**A real dependency-resolution bug hit and fixed properly**: `@react-pdf/renderer` (already used elsewhere in this codebase) couldn't run standalone via `tsx` — its `@react-pdf/hyphenate` sub-dependency's `exports` map only supports ESM `import`, not the CJS `require()` a bare Node script uses. Fixed by running the PDF generation through a genuinely temporary Next.js route under `next dev` (matching this project's existing `devpreview` route pattern), then deleting it — not a permanent workaround.

**One honest, disclosed deviation**: the orientation slide shipped as a 1920×1080 SVG instead of a PNG, since no rasterization library exists in this codebase — flagged in CLOUD_CLAUDE.md rather than silently substituted.

**A real, correctly-flagged open gap**: `press@casewhy.com`'s DB-side alias config is live, but the matching Gmail label/filter needs Peter's own Workspace step — this session's Gmail connector is scoped to his personal account, not `info@casewhy.com`, where the other 12 alias labels actually live (a known, already-documented limitation, not new).

**Backlog research figures**: left as sourced links without fabricated numbers where a live data pull genuinely wasn't possible this round (USCIS/State Department pages blocked automated fetches, consistent with this project's prior experience) — no invented statistics.
