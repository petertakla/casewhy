# New task for Claude Code — round 57: fix GitHub Actions CI, which has been failing for multiple days

**Status: authorized now, Sep 10.** Peter's been getting "CI: All jobs have failed" emails from GitHub for `petertakla/casewhy` for several days — this isn't a one-off tied to any single round's commit, it's been happening across many unrelated commits (docs-only syncs, pricing changes, bug fixes, feature rounds). That pattern rules out "this one commit broke the build" and points at something structural in the CI setup itself, not the app.

## Investigate first, as part of this round (not a guess-and-fix)

You have real `gh`/shell access this cloud session doesn't, so get the ground truth before changing anything:

- `gh run list --workflow=ci.yml -R petertakla/casewhy --limit 15` — confirm how far back this actually goes and whether it's been failing on literally every run, or intermittently.
- `gh run view <a recent failing run id> --log-failed -R petertakla/casewhy` — get the real failing step and real error text. Don't guess from reading the workflow file alone; the actual log tells you whether it's `npm ci`, `npx tsc --noEmit`, `npm run lint`, or `npm run build`, and the exact error.
- `gh secret list -R petertakla/casewhy` — compare the secret **names** configured in GitHub against what `.github/workflows/ci.yml`'s build step actually references (`USCIS_CLIENT_ID`, `USCIS_CLIENT_SECRET`, `USCIS_FOIA_CLIENT_ID`, `USCIS_FOIA_CLIENT_SECRET`, `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`, `POSTMARK_API_TOKEN`). Also check whether the build actually needs any of the vars in `.env.example` that `ci.yml` does **not** currently pass through (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PLUS_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL_UNPOOLED`) — the leading theory (cloud session's, unconfirmed) is that GitHub's own Actions secrets store was never fully populated to match what Vercel has, since Vercel deploys are clearly working (every round's "verified live" check has been against production) while this is a separate, apparently-neglected check.

## Fix, shape depends on what the investigation actually finds

Don't build blind — the real error log determines which of these applies, possibly more than one:

- **If it's a missing-secret failure** (a `required()` throw, a Stripe/DB client failing to construct, a "Missing required env var" message, or similar): the values already exist in `.env.local` on this machine and are already live in Vercel's env vars — sync exactly the ones the build actually touches into GitHub via `gh secret set NAME < value` (read from `.env.local`, don't retype/guess values), and add them to `ci.yml`'s build-step `env:` block if they're referenced but missing there. Don't add secrets speculatively — only what the real failure log shows is actually needed.
- **If it's a type/lint error** unrelated to secrets (e.g. something introduced by a recent round that genuinely doesn't compile): just fix the actual code issue.
- **If some route/page is attempting a real network call (DB, USCIS, Stripe) during `next build`'s static generation** that shouldn't need to happen for a CI correctness check: consider whether that page needs `export const dynamic = "force-dynamic"` (the existing pattern used on `/attorneys`, `/accredited-representatives`, `/legal-aid` for exactly this reason — re-seedable data, no build-time DB dependency) rather than continuing to feed CI more and more real secrets it doesn't actually need for a type/lint/build correctness check.

## What must not change

Don't touch Vercel's own env vars or the production deploy path — this is scoped to the GitHub Actions CI check only. Don't add any new secrets to `.env.example` unless the investigation genuinely finds the app now depends on something not documented there.

## Verify live

Push a trivial commit (or re-run the existing failing workflow via `gh run rerun`) and confirm CI actually goes green — don't just reason that it should. Confirm `gh run list` shows a real passing run, not just that the log looks right in isolation. Report back exactly what the root cause was (this is worth having on record — CI silently failing for days without anyone noticing is itself worth a line in the standing status, independent of the specific fix), and fold into `CLOUD_CLAUDE.md`'s standing status.
