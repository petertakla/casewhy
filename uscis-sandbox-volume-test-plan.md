# USCIS sandbox volume test plan — fallback, if no concrete number comes back from USCIS before Monday

**This is engineering judgment, not a confirmed USCIS requirement.** No *sufficiency* number — how much traffic counts as enough — is published anywhere (checked directly: the developer portal, the Torch onboarding PDF, a third-party developer's README, and the Federal Register's PRA notice for the production-access form — none state a volume threshold; see the cloud session's research, folded into "USCIS API access" above). The reply sent to `Torch-Team@uscis.dhs.gov` on Sep 11 asks them directly for a real number. **Check for their answer first, every morning before that day's runs start.** If they give a concrete target, that becomes authoritative — resize the runs below to clearly exceed it, but keep the spread-across-the-day pattern (their own reply said "sufficient traffic (daily)," which implies distributed real usage, not one lump submitted at 9am and never touched again).

**Verified ceiling, not a target (Sep 11, cloud session):** `developer.uscis.gov/get-started/sandbox` does publish a hard rate-limit ceiling for the Case Status API sandbox — **1,000 requests/day, 5 TPS (1 request per 200ms)**. That's a "don't exceed this" cap, not a "hit this" target — the same page has no language about a required or recommended volume for the 5-day test. **Also checked and ruled out the same day:** a claimed "recommended 100–500 requests/day, 20–50 per batch" figure, sourced to a case-management-software vendor's blog (`legistai.com`), turned out to be fabricated — that page was fetched directly and contains no such numbers and no USCIS citation. Don't treat 100–500/day as a real USCIS figure if it comes up again.

If no answer has come by Monday morning, run this plan as the default.

## Why this shape, not just "more calls"

The first attempt (1 success + 1 error call, once a day, 10 calls total across the week) was rejected. Whatever USCIS's internal check actually measures, a single scripted pair executed once a day is trivially distinguishable from a real application generating traffic as real users interact with it throughout the day. **Peter's direction, Sep 11: go for volume near the real ceiling rather than a token increase — 18 runs a day, ~50 transactions per run, spread throughout the day** (~900/day total). Three things ground this, none invented:

1. **~900/day stays under the real 1,000/day ceiling**, with a ~10% margin so an odd retry or a slightly-over-count run doesn't trip a hard lockout. Going all the way to 1,000 exactly would leave no room for error; ~900 is "near the max, less a bit," not "at the max."
2. **Spread across the sandbox's own published operating hours (7AM–8PM ET, Mon–Fri)** — already confirmed real and binding in this project (multiple earlier sessions hit "sandbox down" outside this window; see item 23 and the CW-32/36/38 verification notes). Calls outside this window won't even reach a live sandbox, so all 18 runs have to land inside it — that window is 13 hours, not 16-18; there's no earlier/later time to spread into. 18 runs across 13 hours space out to roughly every 40-45 minutes, 7am to ~8pm ET.
3. **Real variety in receipt numbers and response types**, not the same fixed pair reused every day, and not one flat unpaced burst per run either. This project's own testing already found the sandbox mocks *any* well-formed receipt number (not just the documented `EAC9999103403`), and that different malformed-prefix shapes produce different real error responses (`404` vs `422`, seen across Days 1-4 of the first attempt) — so there's a real, already-proven way to generate legitimately varied traffic.

## The plan

**Window:** Monday, Sep 14 – Friday, Sep 18, 2026. Business days only, matching what USCIS's own reply asked for.

**Runs per day: 18**, spaced roughly 40-45 minutes apart across the sandbox's actual 7AM–8PM ET operating window (approximately 7:00, 7:45, 8:30am ... through ~7:45pm ET) — not a fixed round-number schedule; stagger the exact start time of each run by a few minutes so it doesn't look like a rigid cron tick every single time.

**Per run: ~50 calls**, through the app's actual `getCaseStatus()` code path (never a mock/stub), each run internally paced (e.g. roughly 1 call every 1-2 seconds, so a 50-call run takes well under 2 minutes) — comfortably under the 5 TPS ceiling and closer to how a person clicking through case lookups actually generates traffic than a single burst would —
- ~30 success calls, varying the receipt number each time (different valid-format prefixes/numbers, not the same `EAC9999103403` every single call) so responses cover a genuine mix of mock case types and statuses, not one repeated response body.
- ~20 error calls, rotating through different malformed shapes (invalid prefix, wrong length, wrong format entirely) so the error responses are genuinely varied too, not the same `ZZZ9999999999` every time.

**Daily total: ~900 calls** (18 runs × 50 calls) — under the real 1,000/day ceiling with margin, and roughly 90x the 10/week that was rejected. Not claimed as "the number USCIS wants" — still nobody's published sufficiency figure — but it's about as much real, varied, spread-out traffic as this sandbox account can generate in a day without risking the hard quota.

**Logging:** same discipline as the first attempt — real response codes and bodies, not assumed. Given the volume, a daily rollup per run (call count, success/error split, any real errors or `429`/rate-limit responses hit, and confirmation the day's running total stayed under 1,000) is enough detail for `CLOUD_CLAUDE.md`; no need to transcribe all ~900 calls verbatim the way the 2-call days were. **Watch specifically for any `429` or quota-exceeded response** — that would mean the real ceiling is lower in practice than the published 1,000, and the next day's run count should drop below whatever actually triggered it.

**Before re-requesting the affidavit:** confirm all 5 days completed with no gaps, at this volume (or higher, if USCIS's reply landed by then with a real number this doesn't already clear). Don't re-send until this is genuinely true; a second rejection costs real credibility with USCIS's team.

## What this explicitly is not

Not a guess dressed up as a requirement, and not evidence that more volume is what USCIS actually wants — there's still no published sufficiency threshold, only the 1,000/day ceiling this plan stays under. If Peter or Claude Code finds any better information before Monday — USCIS answers the Sep 11 email, or something else surfaces — that information wins over this plan's numbers. The *shape* (spread across the sandbox's real operating hours, real variety, paced within each run, logged honestly, kept under the real 1,000/day ceiling) is the durable part; the specific run/call counts are Peter's own judgment call (go near the max, less a bit), not a discovered fact.
