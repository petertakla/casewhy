# New task for Claude Code — round 74: make casewhy.com the single, permanent source of truth for the landing page

Status: authorized now, Sep 12. This is the third time app.casewhy.com's signed-out landing page has drifted out of sync with casewhy.com (found and patched round 68, patched again round 71, found drifted again today — menu and look both). A "remember to update both" rule has already failed twice. Peter's direct instruction: casewhy.com is the single version of truth for the landing page, permanently — and the fix decided on is structural, not another manual sync: eliminate the second copy entirely rather than keep reconciling two hand-maintained pages.

## 1. Check before touching anything — don't skip this

Before removing or redirecting app.casewhy.com's root page, grep the codebase (and ask Peter to check email templates, any QR codes, anything sent to real users) for hardcoded links pointing at the bare root of app.casewhy.com (not /dashboard, /get-help, /plus, etc. — just https://app.casewhy.com or https://app.casewhy.com/ itself). Anything currently depending on that URL rendering its own page directly (a deep link from an email, a bookmarked URL, an OAuth callback landing spot) would now redirect instead — confirm nothing breaks silently before shipping. Report what was found either way, even if it's "nothing referenced the bare root directly."

## 2. The actual fix — redirect, don't duplicate

app.casewhy.com's root route (src/app/page.tsx), when the visitor is signed out, should redirect to https://casewhy.com instead of rendering its own independent landing page. When the visitor is signed in, root should keep behaving as it does today (presumably routing to the dashboard or whatever the current signed-in root experience is — don't change signed-in behavior, this is scoped to the signed-out case only).

This means:

  - Delete (or stop rendering) the duplicated marketing copy, hero section, and nav currently hand-maintained in app.casewhy.com's signed-out landing page — it's being replaced by the redirect, not kept as a fallback.
  - casewhy.com's existing "Sign in" link (already pointing to https://app.casewhy.com/auth/sign-in) is untouched — this fix doesn't change how someone actually gets into the app, only what renders for a signed-out visitor hitting the app's bare root.
  - Use a real HTTP redirect (308/301 for a permanent move is appropriate here, since this is a permanent architectural decision, not a temporary one) rather than a client-side-only redirect, so search engines and any tooling treat it correctly too — ties into round 73's indexing work; app.casewhy.com's root shouldn't compete with or duplicate casewhy.com's root for indexing purposes either.

## 3. Update the standing rule in CLOUD_CLAUDE.md

Add an explicit, permanent note: casewhy.com is the single source of truth for the landing page. app.casewhy.com's root redirects to it for signed-out visitors — there is no second landing page to keep in sync. Any future round that touches landing-page copy, nav, or hero content only ever touches casewhy.com. This replaces the old recurring "remember to check both surfaces" checklist item from prior rounds (round 29-follow-up's Gap 3, round 71 item 4) — that checklist item is now obsolete, since there's only one surface.

## Not in scope this round

  - Any changes to casewhy.com itself — this round is entirely about removing the duplicate on the app side, not modifying the source of truth.
  - The broader casewhy.com/app.casewhy.com domain merge — still Peter's own separate, undated decision (per round 73's framing). This redirect doesn't require or presuppose that merge ever happening; it's a smaller, independent fix that stands on its own either way.
  - Signed-in root behavior — untouched.

## Verify live

  - Confirm a genuinely fresh, signed-out visit to https://app.casewhy.com/ (or /) redirects to https://casewhy.com — test in a real incognito/private window, cookies cleared, not just a logged-out UI state.
  - Confirm a genuinely signed-in visit to the same root still behaves exactly as it did before this round.
  - Confirm the redirect is a real server-side HTTP redirect (check the response status/headers directly), not a client-side flash-then-redirect.
  - Confirm the grep from item 1 was actually done and its findings reported, even if empty.
  - tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, including the new permanent single-source-of-truth note from item 3.
