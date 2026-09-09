# New task for Claude Code — round 47: raise the free-tier case cap from 1 to 3

**Status: authorized now.** From the Sep 9 pricing recheck (`casewhy-plus-pricing-recheck-sep9.md`): a fresh competitor check found VisaWatch's free tier already tracks up to 3 cases, while CaseWhy's free tier caps at 1 — the one place CaseWhy is measurably more restrictive than a named, direct competitor, and the comparison a prospective user makes before ever getting to "is Plus worth $9.99." Peter's decision: match it — bump the free tier to 3.

## The change

`TIER_LIMITS.free.maxCases` in `src/lib/billing/tier.ts`, `1 → 3`. Same constant-and-copy-sweep pattern as round 17's `TIER_LIMITS.plus.maxCases` change (5→10) — grep for hardcoded "1 case" / "one case" / "single case" near tracking-related copy rather than relying on memory of where it appears, the same lesson round 17 called out for its own sweep. Check the same spots round 17 found: the `/plus` page's comparison table (free vs. Plus), any FAQ mention, the dashboard's free-tier "at cap" message (`TrackCaseButton.tsx` — round 17's note there specifically flagged this one as hardcoded separately from the `TIER_LIMITS` constant since that module isn't safe to import in a client component), and the static `casewhy.com` marketing site if it names the free-tier number anywhere (separate commit, `main` branch).

## No schema change

This is a config-constant change plus a copy sweep — `tracked_cases` already supports multiple rows per free-tier account (round 17 proved the underlying mechanism works, it just enforces a different number). No migration needed.

## Interaction with round 46

Independent of round 46 (Plus tier: unlimited-with-gate, 1-10 auto-approved / 11-25 queued / 25 hard ceiling) — that round's bands are unaffected by this change and don't need renumbering. If round 46 hasn't shipped yet when this is picked up, build in either order; if it has shipped, double check the free-tier "upgrade to Plus" messaging (e.g. "upgrade to CaseWhy Plus for up to 10 cases") still reads correctly once free tier says 3 instead of 1 — the delta between free and Plus is now smaller in raw number terms (3→10 vs. the old 1→10), which is fine and expected, just worth a copy read-through so the upsell framing doesn't feel awkward at the new numbers.

## Verify live

Confirm a real free-tier account can track 3 cases and is blocked/upsold on a 4th, all free-tier copy referencing the old "1" is updated, `tsc`/lint clean, production build succeeds, reconfirmed live (not just dev server). Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
