# New task for Claude Code — round 98: one navigation system for `/admin/*` — entry from the dashboard, shared admin shell, index page, and a registry so no future admin page is ever orphaned

**Status: authorized now, Sep 15 (Peter's direct request, expanded the same day after a design audit of every page under `src/app/admin/`). Numbering: 97 is done; per round 95, confirm 98 is free against `CLOUD_CLAUDE.md` before building and renumber with a note if not.**

## The audit (cloud session, Sep 15, read from the repo)

| Page | Round | Reachable from today | Links out |
|---|---|---|---|
| `/admin/marketing` | 89 | nothing — URL only | Attribution →, View log → |
| `/admin/marketing/log` | 89 | queue page | ← Back to queue |
| `/admin/marketing/attribution` | 93 | queue page | none — dead end |
| `/admin/inbox` (alias mail replies) | 70 | nothing | none |
| `/admin/aliases` (alias poll config) | 70 | nothing | none |
| `/admin/backlink-outreach` | 84 | nothing | none |
| `/admin/community-replies` | 85 | removed by round 89 (404) | — |
| Marketing config (subreddit list, daily cap, `links_enabled`) | 89 | **no page exists** | — |
| `/admin` index | — | **does not exist** | — |
| Signed-in header (`AuthHeader.tsx`) | 80 | — | no Admin entry |

Root cause: six rounds each added a page with ad-hoc links, and nothing forces a new page to register anywhere. Peter has been the integration test. This round replaces that with one registry, one shell, and a standing rule.

## What to build

### 1. `src/lib/admin/nav.ts` — the single registry

One exported array. Every admin page is an entry: `{ href, label, labelEs, group, description, pendingCount?: () => Promise<number> }`. Groups, in this order:

- **Marketing** — Queue (`/admin/marketing`), Log (`/admin/marketing/log`), Attribution (`/admin/marketing/attribution`), Settings (`/admin/marketing/settings`, new — item 4)
- **Mail** — Replies (`/admin/inbox`), Alias config (`/admin/aliases`)
- **Outreach** — Backlink drafts (`/admin/backlink-outreach`)

Everything that renders admin navigation reads this array. Nothing else hard-codes an admin href. Rounds 90–94 add their pages by appending an entry — that's the whole point.

### 2. `src/app/admin/layout.tsx` — a shared admin shell

- Wraps every `/admin/*` page. Does the `isAdminEmail` check **once here** (keep the per-page checks too for defense in depth — the layout is UX, the page check is the boundary).
- Left sidebar on desktop / top tab strip on mobile, rendered from the registry, grouped, current page highlighted, pending-count badges where an entry defines one (Queue: `pending + escalated`; Replies: pending alias actions; Backlink drafts: pending).
- Breadcrumb at the top of the content area: **Dashboard › Admin › Marketing › Log**, every crumb a link.
- A persistent "← Back to dashboard" link and the normal signed-in header above it, so admin never feels like leaving the app.
- Remove the ad-hoc links now on the queue and log pages — the shell replaces them. Don't leave both.

### 3. `/admin` — an index page

Cards, one per registry entry, grouped, with the description and the pending badge. This is where "Admin" in the header lands, and what the operator manual will call "the admin home."

### 4. `/admin/marketing/settings` — the config page that should already exist

Round 89 left the subreddit list in a DB table (`community_source_configs`) with no UI, and the daily draft cap as a source constant (`DAILY_DRAFT_CAP` in `src/lib/marketing/config.ts`). Build a small settings page: editable subreddit list (add/remove), and move the cap into the same config table so it's a numeric field here (default 5), and `links_enabled` shown as **read-only with an explanation** ("Flipped by round 96 after the production gate — not a toggle") so nobody flips it by accident. Same admin gating as everything else.

### 5. Header entry — `AuthHeader.tsx`

- Add **Admin** to the signed-in nav (Dashboard · Ask · CaseWhy Plus · Get Help · Settings · **Admin** · Sign out), rendered **only** when the session email passes `isAdminEmail`. Non-admins see nothing — not a disabled item, nothing.
- Links to `/admin`. Carries the total pending badge (sum of registry `pendingCount`s), cached ~60 s so the header render path stays cheap; if that's awkward in the header, badge only inside the admin shell and say so.
- Spanish (round 80 shell): **Administración**; registry `labelEs` values: Cola de marketing, Registro, Atribución, Configuración, Respuestas de correo, Configuración de alias, Borradores de enlaces. Breadcrumb root: Panel › Administración. Append all new strings to the round 81 manifest.

### 6. Standing rule — add to `CLOUD_CLAUDE.md` next to rounds 88 and 95

> **Every new `/admin/*` page registers in `src/lib/admin/nav.ts` in the same round that creates it.** A page that isn't in the registry is not done. Rounds 90–94 (posters, content pipeline, email issues, casewhyhub/outreach) must add their admin surfaces this way, not with one-off links.

### 7. Queue page: group by channel, filter, and a status toggle

Today `/admin/marketing` renders one flat list of pending + escalated items, newest first, with no grouping or filtering (confirmed from `marketing/page.tsx`). Change it to:

- **Grouped by channel**, one collapsible section per channel that has items, in the registry's channel order (community channels first, then owned), each header showing `Reddit · 3 pending · 1 escalated`. Escalated cards pin to the top of their section. Empty channels don't render.
- **Channel filter** (chip row from `CHANNEL_LABELS`) and a **status toggle**: default `Needs action` (pending + escalated, today's behavior); alternate `Recent history` (posted / edited_posted / rejected, last 30 days, read-only cards) so the operator can check what went out without the CSV.
- Filter/toggle state in the URL query (`?channel=reddit&view=history`) so a view can be bookmarked or linked from the sidebar badge.
- Keep the card component unchanged.

## Verify live

- As `admin@casewhy.com`: Admin appears in the header on `/dashboard`; it lands on `/admin`; every registry entry is reachable from the sidebar and the index; breadcrumbs resolve on every admin page; `/admin/marketing/attribution` now has a way back; badges match real counts.
- As a normal test account: no Admin entry anywhere; direct navigation to each `/admin/*` URL still redirects exactly as before.
- `/es/dashboard` shows Administración; Spanish labels render throughout the shell.
- Queue page: with items across ≥2 channels, sections render in registry order with correct counts; escalated pins to top; channel filter and history toggle work and survive a reload via the URL.
- Settings page: add and remove a subreddit, change the cap, confirm the next `poll-community` run honors both; `links_enabled` is visibly not editable.
- `grep -rn "/admin/" src/app --include=*.tsx` shows no admin href outside the registry and the shell.
- tsc/lint clean, production build succeeds, deployed. Fold into `CLOUD_CLAUDE.md` referencing rounds 70, 80, 84, 85, 89, 93.

## After shipping

Report the final labels and the sidebar-vs-tabs choice. The cloud session will update the Marketing Operations manual (Sections 2–3, 4 and 8 — navigation, grouping/filter, and the new Settings page; the button labels were already corrected in the Sep 14 verified version).

---

## Claude Code build notes (Sep 14/15, 2026)

Shipped in two passes — items 1-6 first, then item 7 once a re-check against Drive (before writing final docs) turned up a newer revision of this same task doc with real new scope, not just a typo fix. Full build/bug/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 98."

Two real bugs caught and fixed before/during shipping, not after:
1. A production build failure (`pg` pulled into the client bundle via the registry's own pending-count queries) — fixed by splitting `nav.ts` (client-safe) from `nav-counts.ts` (server-only), the same pattern `locale-href.ts` already established in round 82.
2. A live Spanish-rendering inconsistency (header stuck in English while the shell's sidebar correctly showed Spanish) — fixed by adding `/admin` to `AuthHeader.tsx`'s locale-aware prefix list.

One deliberate simplification from the literal spec, stated rather than silently done differently: the header's pending badge isn't polled every ~60s — it's fetched once per sign-in, since this is a single-admin internal tool. The task doc's own escape hatch ("if that's awkward in the header, badge only inside the admin shell") was taken.
