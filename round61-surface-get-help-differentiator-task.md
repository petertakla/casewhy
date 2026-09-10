# New task for Claude Code — round 61: put round 60's differentiator where people can see it before they sign up

**Status: authorized now, Sep 10 — same day as round 60.** Peter's question, verbatim, once round 60 was confirmed shipped: "do we need to include it in the static marketing page and in casewhy somewhere ... it's a real differentiator." Yes to both — checked directly against `CLOUD_CLAUDE.md` first to confirm round 60 is genuinely DONE (both phases, adversarial-tested, deployed) before writing this, since marketing copy for an unshipped feature would be the exact mistake this project has been careful to avoid everywhere else (case-tracking, billing, USCIS access). It's real now, so it's safe to say so.

## What actually shipped (round 60) — the copy below has to stay accurate to this, not a rounder version

A guided 2–3 question chooser on `/get-help` that recommends a real entity type, **plus** a new, genuinely zero-friction "ask CaseWhy" surface at `/get-help/ask` — no sign-in, no account, no tracked case, confirmed live via a real signed-out request with no auth token at all. It answers general USCIS process/policy questions (grounded in the same policy knowledge base the case-grounded chat cites); a case-specific question ("what does my status mean") gets redirected to sign-in + track-a-case rather than guessed at. Rate-limited 5 questions/IP/day. The hard guardrail — never recommend AI over a licensed human for court/removal-proceedings/representation-need situations — is enforced twice (a deterministic keyword check, then the model's own system prompt) and was adversarial-tested with real prompt-injection attempts, all refused correctly.

**What this means for any copy below: "free," "no sign-up," and "ask anything about USCIS" are all literally true. "Ask about your specific case" is not — that still needs an account. Keep that line correctly drawn everywhere below; it's the same distinction the feature itself enforces.**

## Two real places to add this — checked directly, not guessed

**1. `casewhy.com`'s existing Get Help section (round 38 built this — extend it, don't duplicate it).** That section already has a headline ("More than a tracker — real help, free"), an intro line, the entity-type list, and a CTA to `app.casewhy.com/get-help`. Add one short new line/callout — placement is your call (right after the intro line reads naturally, or as a second CTA next to "Explore Get Help →"), something in this shape, adjusted to fit the section's existing voice:

> "Not sure which one you need? Answer two quick questions and we'll point you to the right option — or just ask CaseWhy's AI directly, free, no sign-up required."

If there's room, a second, shorter CTA button/link ("Ask a free question →") pointing straight to `app.casewhy.com/get-help/ask` alongside the existing "Explore Get Help →" is worth it — this is the one part of Get Help a visitor can actually *use* without creating an account, which makes it a stronger top-of-funnel hook than the entity directories are on their own.

**2. `app.casewhy.com`'s own root landing page (`src/app/page.tsx`) — checked directly, this is a second, separate pre-launch landing page from `casewhy.com`'s, reachable for anyone who lands on the app domain directly.** Its "What CaseWhy does differently" grid has an "Act" card that already says: *"General next-step guidance for your situation, and a clear line to a licensed immigration attorney the moment something is specific to your case."* Update that description (keep the same 4-card grid — don't add a 5th card, it'll break the `lg:grid-cols-4` layout) to also mention the free AI option, e.g.:

> "General next-step guidance for your situation — including a free AI chat for general questions, no sign-up needed — and a clear line to a licensed immigration attorney the moment something is specific to your case."

Adjust wording to fit the card's existing length/tone; the two facts that have to stay in (free + no sign-up, and the human-attorney line staying intact) are what matter, not the exact phrasing.

## What I deliberately left out of this round — flagging the call, not hiding it

Didn't add anything to `/plus`. Round 52 already tuned that page's headline pitch around *unlimited* AI questions about *your own tracked case* — a genuinely different, paid-tier value prop from round 60's free, anonymous, general-question surface. The two aren't in conflict (one's about volume on your case, the other's about zero-friction general questions), but wording that on a pricing page needs real care not to undercut the paid pitch, and it wasn't asked for explicitly — if Peter wants it there too, worth its own short pass with the exact wording checked against `/plus`'s current copy first, not bolted on here.

## Keep it honest

Same rule as every other round that's touched customer-facing copy: don't overclaim. Both facts above (zero-friction access, and the honest redirect for case-specific questions) are true as of round 60's live deployment — verify they're still true at build time (a quick real check against `/get-help/ask`, same as round 38 told the previous round to re-check live status before publishing) rather than trusting this doc if meaningful time has passed.

## Verify live

Confirm the new `casewhy.com` copy renders correctly and matches the section's existing visual style, any new CTA link actually lands on `app.casewhy.com/get-help/ask` and works signed-out, the `app.casewhy.com` root landing page's updated "Act" card still fits the 4-card grid at both desktop and mobile widths, and neither change makes a claim that isn't true of what round 60 actually shipped. `tsc`/lint clean, production build succeeds on both sites. Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
