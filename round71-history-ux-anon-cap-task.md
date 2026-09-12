# New task for Claude Code — round 71: real USCIS history capture, dashboard/nav UX fixes, non-resetting anonymous question cap

**Status: authorized now, Sep 12.** Six items from Peter, bundled here since several touch the same files; each is independently scoped so they can ship as separate commits. Cleared to build as spec'd, including the two open investigate-first steps (item 1-2's real USCIS response shape, item 9's IP-vs-cookie identity call) — Claude Code's judgment on those, not blocked on further sign-off.

## 1 & 2 — Populate CaseWhy history from USCIS's actual case history, and widen the record structure to hold it

**The gap:** Round 69 (`case_status_history`) only captures a status *change* detected by the cron's own before/after diff, going forward from whenever a case gets tracked. It does not backfill whatever history already exists on USCIS's side at the moment a case is first tracked — so a case tracked mid-process starts CaseWhy's history blank, even if USCIS's own API would hand back its full history to date.

**First step, investigate before building — don't assume the shape:** confirm exactly what `getCaseStatus()` (`src/lib/uscis/client.ts`) actually returns today. The original round-1 build note in `CLOUD_CLAUDE.md` says the dashboard "renders status/description/**history**" — track down whether the live sandbox response includes a real multi-entry history array (dates + status text per past event) or whether "history" there just meant the single current status/description pair. Check the actual JSON from a real sandbox call, not the TypeScript types alone (types can be wrong or incomplete).

**If USCIS's response does include real historical entries:**
- On first tracking a case (and safe to re-run on every check without duplicating), write every historical entry USCIS returns into `case_status_history`, not just the entry detected as "new" by the diff.
- Dedupe on a real key (e.g., case + status text + event date) so repeated checks don't insert the same historical row twice.

**Either way, widen the record structure** (Peter's ask #2) beyond round 69's current fields (case ref, case type, status text/category, timestamp, receipt-prefix, milestone dates) to capture whatever else USCIS's real response actually contains and CaseWhy currently discards — candidates to check for: a distinct status *code* separate from the display text, form/receipt notice dates, any sub-status or additional-description field, estimated next-step text if USCIS provides one. Only add fields that are real, present in the actual response — don't invent placeholder columns for data USCIS doesn't send.

**Keep round 69's de-identifiability design intent** (no need to join back to a specific user's identity for a future aggregate query) — this still applies to any new fields added here.

## 3 — Dashboard's "Track case" button isn't state-aware

**Real bug, confirmed in code:** `SearchForm` (`src/app/dashboard/page.tsx`, the receipt-number search form's submit button) is hardcoded to the literal text "Track case" regardless of whether the signed-in account already has tracked cases — `trackedCasesList.length` is computed in the parent but never passed to `SearchForm`. So an account with 3 tracked cases still sees a plain "Track case" button, which reads as if nothing is tracked yet.

**Fix:** pass tracked-case count into `SearchForm` and make the copy state-aware — Peter's suggested direction: something like "Tracked case(s) — Add New Case" when the account already has ≥1 tracked case, vs. today's "Track case" when it has none. Keep it short enough to fit the existing button styling; exact wording is Claude Code's call within that direction, not fixed verbatim.

## 4 — Reconcile `app.casewhy.com`'s signed-out homepage with `casewhy.com`

**Confirmed structurally, not just a vibe:** these are two independently hand-written pages — `casewhy.com` is the static-site `index.html` (`main` branch), `app.casewhy.com`'s root (`src/app/page.tsx`, the Next.js app) is a separate landing page that's drifted out of sync over many rounds (e.g. round 68 found and fixed one stale "email you" copy line on `casewhy.com` that had never been mirrored to `app.casewhy.com`'s equivalent surface, and vice versa in other rounds). This keeps recurring because there's no single source of truth between them.

**This round's fix, scoped narrowly per Peter's ask:** bring `app.casewhy.com`'s signed-out landing page copy/design in line with `casewhy.com`'s current live content — treat `casewhy.com` as the source of truth since it's the public-facing marketing front door. **Do a fresh live side-by-side comparison before writing any copy** — this task doc's own authoring session was working from a known-stale local snapshot of the repo (days old, predates several shipped rounds), so don't trust anything here about current exact wording; pull both pages' real live content first.

**Not in scope this round:** actually merging the two into one domain — see the separate explanation given to Peter directly about why that's still gated on production USCIS API access, and Peter's own decision on whether/when to pursue it.

## 7 — Signed-in nav has no indicator that there are more items off-screen

Peter's report: when the signed-in nav bar is horizontally scrollable (more nav items than fit the viewport width), there's no visual cue that panning right reveals more — it just looks like the nav ends. Add an affordance at the scrollable edge (a fade/gradient mask is the lightest-weight standard pattern; a small chevron is the alternative) so it's discoverable without accidental scrolling. Should respect `prefers-reduced-motion` if any animation is involved, and needs to actually disappear once scrolled to the true end (not a static decoration that's wrong once the user gets there).

## 9 — The anonymous 3-free-questions cap must never reset

**Confirmed exactly how this works today, not guessed:** `src/lib/get-help/rate-limit.ts` implements a rolling **24-hour** per-IP window (`WINDOW_MS = 24 * 60 * 60 * 1000`) — every IP's counter genuinely resets a full day after its first use, forever, by design (this was the deliberate round 60/63 build). Peter's point stands on the actual mechanism, not a misunderstanding: a signed-out visitor can ask 3 free questions every single day indefinitely, which is a **better** long-run deal than a free signed-in account's 3-per-*month* cap — exactly backwards from what should nudge someone toward creating an account or subscribing.

**Fix:** replace the resetting daily window with a cap that never resets. This needs a durable store, not the current in-memory-per-instance `Map` (which the file's own comment already flags as "not a truly global/distributed limit" — an in-memory counter can't represent "never resets" meaningfully across cold starts and redeploys anyway, so this isn't optional scope creep, it's required by the fix itself). A lightweight table (IP or a set first-party cookie/device id → lifetime count) is enough; no need for a new external service if the existing Postgres is fine for the traffic level.

**One real design call for Claude Code to make, not Peter:** identify visitors by IP alone (simple, but churns on mobile carriers/shared networks — could under- or over-count real individuals) vs. a first-party cookie/device id (more stable per-browser, but trivially cleared) vs. both together (count against whichever identifier is stricter). Pick one, document the tradeoff in the code comment the way `rate-limit.ts` already does today, and don't over-engineer this beyond what a pre-revenue product's real abuse risk justifies.

**Consistency check:** the "Does this apply to my case?" / "What does this mean for my case?" pills on the anonymous `/get-help/ask` surface already route through this same cap (confirmed — round 63 wired them through the existing limiter) — make sure the non-resetting version keeps that wired the same way, not accidentally exempted.

## Verify live

- Track a case with real sandbox history (if USCIS's API genuinely returns more than current status) and confirm `case_status_history` gets multiple real backfilled rows, not just one.
- A real account with existing tracked cases sees the state-aware button copy; a fresh account with none sees today's copy.
- `app.casewhy.com` and `casewhy.com` reviewed side by side live, not from memory.
- Force a narrow viewport on the signed-in nav and confirm the new scroll indicator appears and correctly disappears at the true end.
- A real anonymous visitor's 3 questions stay spent past a 24-hour boundary (test by manipulating the stored timestamp/count directly in whatever store replaces the in-memory map, not by waiting a real day) — confirm the cap does not reset.
