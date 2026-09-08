# New task for Claude Code — build the "Get Help" hub page and surface it everywhere it belongs

**Status: authorized now, scoped narrowly.** Peter asked directly for the "Get Help" menu work to go to code. This task is the hub page itself (minimal — one live category, five graceful placeholders) plus wiring it into navigation everywhere it makes sense. **Not in scope:** building the actual directories for entity types 3-6 (legal aid orgs, DSOs, community orgs, employers) or round 29 (BIA-accredited representatives) — those stay separately gated, same posture as the rest of the backlog in `partner-marketing-domain-concept.md`. This task only needs the hub page to handle their absence gracefully, the same way `/attorneys` was allowed to ship "empty pending real vetted entries" with a fallback rather than waiting for the directory to be populated.

Full background and reasoning for all of this: `partner-marketing-domain-concept.md` in the Ideas project ("Get Help" section and its "Where 'Get Help' is surfaced" sub-section) — this task doc is the buildable slice of that spec, not a new decision.

## Part 1 — the hub page itself

A new page, `/get-help` on the Next.js app (`app.casewhy.com/get-help`), presenting six cards, one per entity type:

1. **Attorneys** — live. Links to the existing `/attorneys` page (round 27/28, already built).
2. **BIA-accredited representatives** — not built yet (round 29 not started). Show as a "Coming soon" card, no link — don't stub out a fake `/accredited-representatives` page for this task.
3. **Legal aid / nonprofit immigration organizations** — same, "Coming soon," no link.
4. **University international student offices (DSOs)** — same, "Coming soon," no link.
5. **Community and cultural organizations** — same, "Coming soon," no link.
6. **For Employers** — same, "Coming soon," no link. (When this one does get built later, it's a lead-capture page, not a directory — see the entity-type list in `partner-marketing-domain-concept.md` for why.)

Same "informational listing, not an endorsement" disclaimer language already used on `/attorneys`, once at the top of the hub page. Public page, no sign-in required — matches `/attorneys`.

**Also state plainly, near that same disclaimer, that this is free.** Decided Sep 8: something like "Every resource here is free to use, always — no fees, no ads, no hidden cost." This isn't just a nice-to-have caption — Peter asked directly for the free-ness of this feature to be surfaced clearly, not left implicit. Tie it to the app's existing "no ads, ever" trust positioning if there's a natural place to do so, rather than treating it as an isolated line.

## Part 2 — surface it everywhere (the full map)

Each of these is a separate small change, safe to do in any order and in parallel:

1. **`casewhy.com` root nav** (static `main`-branch marketing site) — add a "Get Help" nav item next to the existing "Sign in" link. Since this crosses domains (static site → Next.js app), point it at `https://app.casewhy.com/get-help`, same cross-domain pattern already used for "Sign in" → `https://app.casewhy.com/auth/sign-in`.
2. **`casewhy.com` footer** — add "Get Help" alongside the existing Privacy/Terms/Contact links.
3. **`app.casewhy.com`'s own landing page footer** (`src/app/page.tsx`) — currently Privacy/Contact/Terms (three items) — add "Get Help" as a fourth, same treatment as when Terms of Service was added there.
3a. **The `/plus` marketing page** — add an explicit line clarifying Get Help is not a Plus perk; it's free to every user regardless of subscription. Without this, a visitor comparing tiers could reasonably (and wrongly) assume it's paywalled.
4. **Signed-in app nav** (`AuthHeader.tsx`) — add "Get Help" positioned immediately after "CaseWhy Plus" in the nav order — Peter's explicit placement instruction (Sep 8), not just "somewhere alongside" the existing items.
4a. **Signed-out top nav on `app.casewhy.com`** — decided Sep 8: "Get Help" needs to be in the top menu here too, not left in the footer only (item 3 above). Whatever header/nav renders for a signed-out visitor on the app (whether that's `AuthHeader.tsx` conditionally, or a separate component — locate the actual signed-out render path rather than assuming it's the same component as item 4) needs its own "Get Help" entry, positioned the same way relative to "CaseWhy Plus"/"Sign in" as makes sense for that state. The footer placement (item 3) stays too — this is additive, not a replacement.
5. **Dashboard explanation** — wherever the AI explanation currently gestures at "consult an attorney" (CW-31's guardrails allow this when the case facts support it), link that phrase to `/get-help` instead of leaving it as inert text.
6. **Chat (CW-32) guardrail redirects** — the adversarial-question guardrails already redirect toward an attorney or legal aid in some cases (the fraud question, the "should I pay the officer" question, per CW-32's own guardrail testing) — make those redirects a real link to `/get-help`.
7. **Escalation toolkit (CW-39)** — add a "Get Help" CTA directly in the stalled-case card and/or the letter-drafting flow — someone drafting a congressional inquiry letter is exactly who'd also want a real attorney or legal aid org.
8. **Find and replace the current single "find an attorney" link**, wherever it actually lives in the codebase — this has been referenced a few times in planning docs but never pinned to a specific file, so locate it directly (grep for "find an attorney" or similar) rather than guessing, and point it at `/get-help` instead.

Item 9 from the original surfacing map — a "Settings/footer" link for the Employers page — is **not** part of this task, since the Employers page itself isn't being built here (see Part 1, item 6 above). Revisit that link when Employers actually gets built.

## Sequencing

No dependency on round 26 (push notifications, current top priority) or round 29 — this can slot in whenever convenient. Report back once live, same as other rounds, and fold this into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
