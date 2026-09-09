# New task for Claude Code — round 49: fix entity-type ordering in the homepage share text

**Status: authorized now.** Peter checked the live share function (round 44) and found the share text lists the Get Help entity types starting with "attorneys" — inconsistent with round 45's decided hero ordering (free legal aid → accredited representatives → attorneys, chosen specifically to put the free/no-cost framing first, matching the "free, no ads, ever" line the sentence closes on). Round 44 shipped before round 45's ordering decision existed, so the share text's generic app-pitch line never picked it up.

## The fix

Find the actual live share text for the `casewhy.com` homepage hero placement (the `<ShareButton>`/vanilla-JS widget's `text` prop for that placement — check both the React component usage in the Next.js app and the mirrored vanilla-JS widget on the static `main` branch, since round 44 built two separate implementations with no shared code between them). Wherever it names the three entity types, reorder them to match the hero's own copy exactly: **free legal aid, accredited representatives, and attorneys** — not attorneys-first. If the share text was written as its own independent sentence rather than literally copied from the hero, rewrite it to use the same three-item order rather than just checking whether it happens to match.

## Scope check — don't touch what isn't the same list

This ordering fix applies specifically to wherever the share text enumerates these three named entity types as a list. It does **not** apply to the per-listing share text on individual entity permalinks (round 44 placement 2 — "Found this on CaseWhy — [Org Name]..." — that's a single specific resource, not an ordered list, nothing to reorder there) or to any other placement that doesn't name the three types in sequence. Check all six placements from round 44's spec, but only touch the ones that actually list attorneys/accredited-reps/legal-aid in a fixed order.

## Verify live

Confirm the corrected order renders in a real share action on `casewhy.com`'s homepage (both the native `navigator.share()` path if testable and the fallback dropdown text), confirm the Next.js app side of `<ShareButton>` if it has the same three-type listing anywhere, confirm no other placement was accidentally changed. Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
