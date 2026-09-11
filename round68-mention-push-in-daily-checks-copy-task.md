# New task for Claude Code — round 68: "Daily automatic checks" copy only mentions email, but push notifications shipped after this copy was written

**Status: authorized now, Sep 11.** Peter flagged this directly, quoting the live copy: "Daily automatic checks — We check your case with USCIS every day and email you the moment anything changes — no refreshing, no guessing." That's Card 1 of `casewhy.com`'s "What's already built" section (`main` branch, round 7, Sep 6). Round 26 (web push notifications, VAPID) shipped two days later, Sep 8 — this card was never updated afterward, so it still describes email as the only notification channel even though push has been live since round 26.

## Fix

**`casewhy.com`'s "What's already built" section, Card 1** — update the body copy to mention both channels. Something close to:

> "We check your case with USCIS every day and notify you the moment anything changes — by email, and by push notification if you've enabled it — no refreshing, no guessing."

Keep the card heading ("Daily automatic checks.") as-is — only the body copy is stale. Don't oversell push as always-on; it's opt-in (Settings toggle, round 26), so the wording above is deliberately conditional ("if you've enabled it") rather than implying every visitor already gets push. Word it however reads cleanest, this phrasing isn't final — just make sure it's accurate and doesn't overclaim.

## Also check, don't assume

- **`app.casewhy.com`'s own landing page** (`src/app/page.tsx`) — this is a separate pre-launch page from the static site, with its own "Track / Understand / Act" card copy (the "Act" card was touched most recently in round 61, for an unrelated reason). Check whether its "Track" card or subheadline has the same email-only framing this static-site card had, and fix it the same way if so — don't leave one page accurate and its sibling stale.
- **Any other marketing copy that names notifications as email-only** — a quick grep across both `casewhy.com`'s static markup and `page.tsx` for "email you" / "email the moment" / similar phrasing, in case this pattern was copy-pasted somewhere else during round 7 that isn't the one card Peter happened to quote.
- **Settings page's own notification-toggle labels** (round 14/26) are a separate surface, not marketing copy — no reason to expect they're wrong (they describe each channel individually, by design), but worth a glance while in the area rather than assuming.

## Out of scope

No functional change — push notifications, their Settings toggle, and the underlying `sendPushToUser()`/email-send logic (round 26) are untouched. This round is copy-accuracy only.

## Verify live

Confirm the updated card copy is live on `www.casewhy.com` (real `curl`/browser check, not just the commit diff), confirm it doesn't overclaim push as automatically-on, and confirm whether `page.tsx` needed the same fix — report either way (fixed, or checked and it didn't need it).
