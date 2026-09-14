# New task for Claude Code — round 86: finish round 85's alias filter/label setup (incomplete)

**Status: authorized now, Sep 14.** Round 85 was reported as complete, but the actual filter/label setup it specified was not built. Peter has done his own prerequisite step — the peter and admin aliases now exist on info@casewhy.com in the Workspace admin console. **What's still missing is everything round 85 asked Claude Code to build on top of that: the nested Gmail labels and the sender-domain filters that route platform notification mail into them.**

## What round 85 actually specified, restated precisely since it was missed

  - A filter matching mail **to** peter@casewhy.com **from** each platform's real notification-sending domain (verify each one against a real email from that platform first — don't guess at the domain).
  - Each filter applies a **nested label**: Peter/Reddit, Peter/Facebook, Peter/Quora, and equivalents for whichever of VisaJourney/Trackitt/immigration.com actually send account mail from a consistent domain.
  - This is the same filter-by-sender-then-label mechanism already proven working in round 70's dozen business-alias filters — not a new pattern, a direct reuse of one that's already live and confirmed error-free.

## Also close the loop on admin@

Round 85 never specified an admin@ alias — Peter created it independently. Before building anything further, **confirm with Peter what** **admin@** **is actually for** rather than assuming it needs the same platform-label treatment as peter@. If it's meant for something else entirely (e.g., a general admin/ops address), it may need its own, different filter setup, or none at all — don't extend round 85's pattern onto it without checking what it's actually for first.

## Why this matters beyond just finishing the task

Round 85 was marked done without this piece actually existing — worth being genuinely careful verifying the rest of round 85's other pieces (Reddit polling, the relevance filter, the draft-reply queue extension) actually work as specified too, rather than assuming they're fine because this one gap happened to surface first. Re-check the full round 85 spec against what's actually live, not just this filter piece.

## Verify live — this time, actually verify, don't just report done

Send a real test email to peter@casewhy.com mimicking each platform's actual sender (or better, trigger a real notification from each real account created for round 85) and confirm it lands under the correct nested label, not just in the general inbox. Do this for every platform in scope, not a single spot-check. Report back explicitly listing which platforms were tested and confirmed working, and get a clear answer on what admin@ is for before treating it as in scope. Fold into CLOUD_CLAUDE.md's standing status, referencing round 85 and round 70's original filter pattern.
