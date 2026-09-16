# Round 111 follow-up (no new number) — founder is "Peter", never the last name, everywhere

Status: authorized Sep 16, 2026. Peter: "need to audit all info to ensure only my first name is used and not my last name … that is a standing rule."

## Standing rule

In everything CaseWhy publishes or sends — casewhy.com, app.casewhy.com, casewhyhub.com, the one-pager/slide/PDF kit, JSON-LD, RSS, email templates and sender names, social bios, admin-facing copy that could leak into a screenshot — the founder is "Peter" (or "Peter, founder" / "Peter, founder of CaseWhy"). The last name never appears. CI checks now enforce this on both `nextjs-app` (`scripts/check-founder-name.ts`) and `casewhyhub` (a grep step in that branch's new `.github/workflows/ci.yml`).

## What a cloud-session audit found live (Sep 16)

Fetched every non-directory URL in app.casewhy.com's sitemap, casewhy.com, and all 8 casewhyhub.com pages. Only two pages carried the last name, both from round 111:

1. casewhyhub.com/press — the "story in three sentences" opening, the Founder section, and the Organization JSON-LD `founder.name`.
2. casewhyhub.com/resources — the first-person boilerplate attribution line.

## Claude Code build notes (Sep 16, 2026) — DONE, fully verified live

Fixed `scripts/content/press.html` and `scripts/content/resources.html` on the `casewhyhub` branch, regenerated via `node scripts/generate.mjs`. Kept the JSON-LD `founder` property (rather than dropping it) with `name: "Peter"`.

Full repo sweep run on both branches (`grep -rni "takla"`), not just the two known pages. `nextjs-app` was already fully clean — remaining hits were internal engineering docs, a real already-sent USCIS legal document (correctly out of scope), the GitHub org/repo path (Peter's own call, flagged not changed), and a `ptakla@gmail.com` code comment (personal-account reference, not the founder-name issue). The round-93 blog Article JSON-LD author was already `{"@type":"Organization","name":"CaseWhy"}`. The one-pager PDF had no last name in its text and no Author metadata set.

Added CI enforcement on both branches so this can't silently regress.

**Verified live:** both branches' CI green. `casewhyhub.com`'s git-push auto-promote (round 94/111's own Production Branch Tracking fix) picked up the fix immediately — confirmed by curling all 8 live hub pages plus the live one-pager PDF, zero last-name hits on any of them.
