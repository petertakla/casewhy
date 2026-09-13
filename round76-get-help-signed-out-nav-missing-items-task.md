# New task for Claude Code — round 76: signed-out nav is missing items specifically on /get-help

Status: authorized now, Sep 12 — real bug report from Peter. When signed out, some nav menu items don't render at all on app.casewhy.com/get-help — not overlapping or cut off, genuinely missing/not rendered. This is the opposite failure mode from round 62 (which was the signed-out nav showing too much, the full signed-in menu) — worth keeping that distinction in mind rather than assuming this is the same bug in reverse.

## What to check before prescribing a fix — don't guess, same discipline as round 62

1.  Reproduce genuinely signed out — fresh incognito/private window, cookies cleared, not just a logged-out UI state — and load /get-help directly (not navigated to from elsewhere in the app, in case referrer/prior-state matters).
2.  Compare against the signed-out nav on other pages (the root landing page, /plus, /processing-times, etc.) — confirm exactly which items are present elsewhere but missing specifically on /get-help, and whether this is unique to /get-help or also affects its sub-pages (/get-help/ask, entity-type pages like /attorneys).
3.  Locate which component actually renders the signed-out nav on /get-help specifically — per round 29-follow-up/round 33's history, there was a distinction between the signed-in nav (AuthHeader.tsx) and a separate signed-out render path added later (round 33's "4a"). Confirm /get-help is using the same shared signed-out nav component as every other page, rather than a page-specific or older copy that never got the later nav-item additions (Get Help itself was added to the signed-out top nav in round 33 — check whether that item, or others added since, are the ones missing).
4.  Check for a timing/hydration race — if nav items are conditionally rendered based on a client-side check that resolves after initial paint, a page-specific loading pattern on /get-help (e.g., the chooser or entity-list data fetching) could be interacting with when the nav finishes rendering. Confirm whether a hard refresh vs. client-side navigation to /get-help produces different results — that would point at a hydration issue rather than a missing-item bug.

## What to report back

The actual root cause found — which items are missing, why, and whether it's isolated to /get-help or broader than reported. Fix whatever the real mechanism turns out to be, not a guessed patch. If it turns out to be a duplicate/stale nav component (a real risk given this project's history of casewhy.com vs. app.casewhy.com nav drift, see round 71 item 4 and round 74's redirect fix), consolidating to one shared component is the right fix, not a per-page patch.

## Verify live

Confirm a genuinely fresh, signed-out, cookie-cleared visit to /get-help shows the full signed-out nav (all the same items present on every other signed-out page), via both a hard refresh and a client-side navigation into the page. Confirm signed-in behavior on /get-help is unaffected. tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, including the actual root cause (not the leading hypothesis) per the round 62 precedent.
