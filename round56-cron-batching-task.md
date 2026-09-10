# New task for Claude Code — round 56: stagger and batch the daily case-status cron job

**Status: authorized now, Sep 10.** Directly authorizing the fix that the still-held `casewhy-scalability-capacity-audit-task.md` (Part 1) would have investigated first — Peter's decided the cron job's future-growth timeout risk is worth fixing now rather than auditing first. The job (`POST /api/cron/check-status`, runs daily, checks every tracked case's status against USCIS) is the single most likely thing to break as `tracked_cases` grows — a function that processes every case sequentially in one invocation will eventually exceed Vercel's execution timeout, and the failure mode matters: does it silently drop whatever cases it didn't get to, or does it fail the whole run?

## Investigate first, as part of this round (not a separate audit)

Before changing anything, get real numbers — this is fast to check and changes the right implementation:
- Current row count in `tracked_cases`.
- How the cron currently processes cases — sequential loop in one invocation, or already batched/parallel in some way?
- The function's actual configured timeout (Vercel plan default, or an explicit `maxDuration` if one's set) and a rough per-case latency estimate against USCIS's API, to know roughly how many cases the current implementation could handle before timing out.
- Whether a timeout mid-run currently drops the remaining cases silently or retries them.

## Build: stagger and batch

The concrete fix, shape TBD by what the investigation above finds, but the goal is fixed: no single invocation should be at risk of hitting the timeout regardless of how large `tracked_cases` grows. Reasonable approaches, in rough order of simplicity:
- **Batch within one invocation, with a time budget check** — process cases in chunks, checking elapsed time between chunks, and if running close to the timeout, stop cleanly and let the next scheduled run (or a follow-up invocation) pick up where it left off, rather than getting killed mid-batch.
- **Multiple staggered invocations** — split the single daily cron trigger into several smaller ones spread across the day (e.g. process cases in ID-range or hash-based shards, one shard per invocation) if Vercel's cron scheduling supports enough granularity for this cleanly.
- **A queue-based approach** (e.g. Vercel's own queue primitives, or a simple DB-backed job table) if the current scale already warrants it — probably more than's needed right now, but worth naming as the eventual answer if row counts get large enough that batching-within-a-day stops being enough.

Pick the simplest approach that actually solves the problem at today's scale plus reasonable near-term growth — this doesn't need to be over-engineered for a scale CaseWhy may never reach, but it does need a real time-budget safety net so a timeout can never silently drop cases without a clear retry path.

## What must not change

The actual per-case check logic, the AI explanation generation, the email/push notification triggering — none of that changes. This is purely about how the batch of "which cases need checking today" gets scheduled/chunked so it can't time out, not about the checking logic itself.

## Verify live

Confirm the real current numbers found during investigation are reported (row count, current timeout headroom), confirm a real test run processes all tracked cases correctly with the new batching/staggering in place, confirm the retry/resume behavior actually works if simulated (e.g. artificially triggering a partial run) rather than just trusting the code path looks right. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status — including the real numbers found, since that's exactly the kind of data point future rounds (including the still-held scalability audit, if it's ever authorized) will want on record.
