# New task for Claude Code — round 75: clearer help when push notifications are browser-blocked

Status: authorized now, Sep 12. Round 37 already built per-browser detection for the "notifications blocked" state (confirmed working — Peter's own test on Chrome correctly returned Chrome-specific wording and the real Chrome support link, not the generic fallback). The gap isn't detection, it's clarity: the current message is one dense sentence ("Click the lock or tune icon just left of the address bar, then 'Site settings' → Notifications → Allow"), and Peter — not a novice user — still found it harder to act on than it should be. Decision: stick with web push as-is (no SMS, see the separate conversation on that), just make this specific help moment clearer.

## What's actually hard to follow today

Asking someone to recognize "the lock or tune icon" from a text description alone is a real ask — there's no visual anchor, and it's one run-on instruction rather than discrete steps. This round fixes the presentation, not the underlying mechanism.

## Fix

Restructure the existing per-browser instructions (already correctly detected, per round 37) as numbered steps, not one sentence. For example, Chrome's current text becomes something like:

1.  Look at your browser's address bar — find the small icon just to the left of the web address (a lock, or a small "tune"/settings icon).
2.  Click it.
3.  Choose "Site settings."
4.  Find "Notifications" and change it to "Allow."
5.  Come back here and turn the toggle back on.

Apply the same numbered-step restructuring to whatever the existing Firefox and Safari variants say today — check casewhy-user-manual-sep10.md's description and the actual live component for current wording on each, don't rewrite from scratch assuming round 37's original draft is what shipped verbatim.

Add a one-line "why am I seeing this" note above the steps, since part of the confusion is not knowing why it's blocked at all: something like "Your browser has notifications turned off for casewhy.com — this can happen automatically if a permission prompt was dismissed earlier, or if it was previously declined." Keep it short; this is context, not an apology.

Check platform, not just browser. Round 37 branched on browser (Chrome/Firefox/Safari) but the underlying mechanism check may not distinguish mobile from desktop within the same browser — Chrome on Android reaches the equivalent setting through a different path (typically the three-dot menu → Settings → Site settings, not an address-bar icon in the same place) than Chrome on desktop. Confirm what's actually being detected today and add a mobile-Chrome/mobile-Safari variant if it's currently just showing desktop instructions to mobile visitors — check before assuming this gap exists, it may already be handled.

Keep the existing "Learn more" link to each browser's own support page — that part already works correctly and doesn't need to change.

## Not in scope this round

  - Any change to the underlying push mechanism, VAPID setup, or the iOS "add to home screen" messaging — those are separate, already-working pieces.
  - SMS or any non-web-push notification channel — explicitly decided against for now.

## Verify live

Confirm the numbered-step version renders correctly in the real blocked state (not just "should work") on at least Chrome desktop, and check whether a mobile variant is needed and whether one already exists. Confirm the "why am I seeing this" line doesn't read as an apology or overclaim a specific cause when the real cause is unknown (frame it as "can happen when," not "this happened because"). tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, noting round 37's original section as the one being refined here.
