# Round 112 Part B — GitHub Actions cron migration, ops_tasks queue, X write-limit check, doc sweep

Status: authorized Sep 16, 2026, queued behind round 113 in round 112's own entry. Real code task, not a standing order (that was Part A).

## Scope

1. GitHub Actions cron migration replacing cron-job.org (a Peter login-gated registration step for every new recurring job, per rounds 70/85/89/90/91/93).
2. The monthly processing-times refresh becoming an `ops_task` queue item.
3. An X free-tier write-limit check.
4. A full sweep of open round docs for misassigned Peter steps.

## Claude Code build notes (Sep 16, 2026) — DONE, fully verified live

**Cron migration.** `.github/workflows/cron.yml` schedules all 7 recurring `/api/cron/*` routes. Committed to both `nextjs-app` and `main` — GitHub's `schedule` trigger only reads the workflow file from the repo's default branch (`main` here, not `nextjs-app`). `uscis-volume-test` deliberately excluded (temporary, time-boxed, already covered by a local script). `check-status`/`poll-aliases` extended to accept `ADMIN_DIAG_SECRET` via the shared `isAuthorizedCronRequest()` helper, purely additive to `CRON_SECRET`.

Real bug: the first `cron.yml` had an unquoted `Authorization: Bearer ...` inside a plain YAML scalar — colon-space breaks unquoted YAML scalars, so every job failed to parse (0 jobs, no real error). Fixed with block scalars (`run: |`), verified with `yaml.safe_load()` and a real `workflow_dispatch` run — all 7 jobs green against production.

Real, unplanned incident: verification curls triggered Vercel's automatic System Mitigations on `app.casewhy.com` (a site-wide `403` "Security Checkpoint," not scoped to this round's routes). `vercel firewall system-mitigations pause` fixed it but is blocked from running non-interactively by Vercel itself — Peter ran it himself. Auto-resumes in 24h; flagged as an open risk that the recurring cron traffic could retrigger the same heuristic, with a Vercel Firewall custom-rule bypass as the real fix if it recurs (not built this round).

**ops_tasks queue.** New table + `/admin/ops-tasks` + monthly `/api/cron/generate-ops-tasks`. The refresh itself still needs a real browser (egov.uscis.gov blocks automated fetches) — this surfaces a real, idempotent, actionable row when one's due instead of a CI log line. Verified live: correctly returned no task (nothing stale since round 106's Sep 15 refresh).

**X write-limit check.** `assertXWriteBudget()` counts real posted writes from `marketing_queue` this calendar month and refuses a thread before any API call if it would exceed X's 500/month free-tier cap. Surfaced on `/admin/marketing/settings`. Not yet exercised against a real post (X posting still unconfigured, per round 90's own open Peter step).

**Doc sweep.** Not a line-by-line historical rewrite — one consolidated correction in CLOUD_CLAUDE.md: every prior "Peter: register X at cron-job.org" instruction (rounds 85/89/90/91/93) is now obsolete, since `cron.yml` covers all of them. Only `uscis-volume-test`'s registration is still genuinely open, and it's staying manual/local on purpose.

## Verify live

- `gh run list --workflow=cron.yml`: all jobs green from a real `workflow_dispatch`.
- `/admin/ops-tasks`, `/admin/marketing/settings`: both real pages, `307` to sign-in unauthenticated.
- `check-status`/`poll-aliases`: `200` with `ADMIN_DIAG_SECRET`.
