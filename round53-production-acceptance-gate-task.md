# New task for Claude Code — round 53: gate production launch to Peter only, for 1 week of acceptance testing

**Status: authorized now, Sep 10.** Peter's ask: when it's time to flip CaseWhy to live (real Stripe keys, real public availability — see `casewhy-plus-live-billing-launch-scope.md`), the very first step shouldn't be opening the doors to everyone. He wants a period — 1 week — where only his own account can actually use the live production app, so he can do real acceptance testing against real production infrastructure (live Stripe, live domain, live email) before any other real user shows up.

## What "gated" means here

Not a separate staging environment — this is the real production deployment, real database, real (eventually live) Stripe keys, just access-restricted. Anyone other than Peter's account hitting `app.casewhy.com` during the gated week should see a clear, honest holding state — not a broken app, not a silent redirect, something like "CaseWhy is finishing final testing before launch — check back soon" — while Peter's own account (by email, matching however admin/allow-list checks already work elsewhere in this codebase — round 46 built an admin approval mechanism, reuse that identification pattern if one already exists rather than inventing a second one) passes straight through to the real app.

## Build

- An environment variable (e.g. `ACCEPTANCE_TESTING_MODE=true` / an allow-listed email, or a single `ACCEPTANCE_TESTING_EMAIL` constant matching Peter's account) that, when set, gates every route behind a check: if the signed-in user's email matches, proceed normally; if not (including signed-out visitors), show the holding page instead of the real app.
- The public marketing site (`casewhy.com`) is a separate concern — decide together whether it stays fully public during the gated week (probably yes, since it's not where any real transaction happens) or also shows a "launching soon" state. Default recommendation: leave `casewhy.com` public, gate only `app.casewhy.com` (where sign-up, checkout, and case tracking actually happen) — flag if Peter wants it the other way.
- This needs to be a flag Claude Code (or Peter directly, once told how) can flip off after the week is up — a single env var toggle in Vercel, not a code change/redeploy to turn off. Document in `CLOUD_CLAUDE.md` exactly which env var controls this and how to disable it, so it's not a mystery a month from now.
- Sign-up/checkout during the gate: since only Peter can get past the gate, no other consideration is needed for signed-out visitors trying to create an account — they simply see the holding page before ever reaching sign-up.

## Sequencing

This should be built and verified well before the actual live-key flip (Part 1/6 of `casewhy-plus-live-billing-launch-scope.md`) — Peter wants the gate itself already working and tested before it's actually needed, not built same-day as the real launch. Turning the gate **on** is a separate, deliberate action at the moment the live-key flip happens (same "explicit switch, not automatic" principle that round governs the Stripe test→live key flip itself) — build the mechanism now, activate it when Peter says so.

## Verify live

Confirm a real second test account (not Peter's) hits the holding page on every route, confirm Peter's own account passes through normally, confirm the marketing site's behavior matches whichever default was chosen above, confirm the env var can be toggled off without a redeploy. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status — including the exact env var name/mechanism, since this is exactly the kind of thing that needs to be easy to find again in a week.
