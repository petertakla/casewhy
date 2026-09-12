# New task for Claude Code — round 70: casewhy.com response aliases, monitoring, and approval-gated action pipeline

**Status: authorized now, Sep 11.** Peter accepted the alias-as-Workspace-alias design as recommended, with no changes to the proposed alias list below. He's adding the aliases to `info@casewhy.com` in the Workspace admin console himself (Directory → Users → info@casewhy.com → Email aliases); everything else below is authorized for Claude Code to build now. The pending-approval-queue UI choice (in-app admin screen vs. Gmail Drafts) is still open — pick one and note the choice rather than building both, per the original spec.

**Peter's ask:** separate email aliases on `casewhy.com` for every type of response CaseWhy's users/correspondents might send in (he named privacy, terms, acknowledgment, corrections, help as examples, plus "whatever else I might have missed"), each with filters, so that code can monitor and act on incoming mail per-alias — at a monitoring/response cadence customizable per alias — but nothing actually sends or executes without Peter's explicit approval first.

## Proposed alias list (confirm or edit before building)

Peter named five; the rest below are this session's additions, flagged as suggestions, not settled:

| Alias | Purpose | Peter named it? |
|---|---|---|
| `privacy@casewhy.com` | General privacy-policy questions | yes |
| `terms@casewhy.com` | Terms of Service questions | yes |
| `acknowledgment@casewhy.com` | Replies/confusion about the Round 69 policy-acknowledgment gate (e.g., disputes about being logged, trouble acknowledging) | yes |
| `corrections@casewhy.com` | Users reporting inaccurate content in the app (wrong case-status text, wrong processing-time claims, typos) | yes |
| `help@casewhy.com` | General "how do I…" user support | yes |
| `privacy-requests@casewhy.com` | *Suggested split from `privacy@`* — formal CCPA/data-deletion or data-access requests specifically, since these carry real compliance deadlines and shouldn't get buried in general privacy questions (this is also literally what the USCIS affidavit checklist asked for — "an easy way to request permanent deletion of their data") | no — suggested |
| `security@casewhy.com` | Vulnerability/security reports — industry-standard address (pairs with a `security.txt` if CaseWhy doesn't have one yet); should always alert immediately regardless of whatever polling interval other aliases use | no — suggested |
| `abuse@casewhy.com` | Reports of misuse of the service | no — suggested |
| `legal@casewhy.com` | Legal notices, subpoenas, copyright/DMCA, law-enforcement requests — should never be auto-actioned, always an immediate human alert, no drafted auto-response | no — suggested |
| `billing@casewhy.com` | CaseWhy Plus payment/subscription questions | no — suggested |
| `feedback@casewhy.com` | Feature requests / general feedback — lowest priority, fine to batch | no — suggested |
| `accessibility@casewhy.com` | ADA/accessibility complaints — good practice for a compliance-adjacent product | no — suggested |

Not proposing `press@` or `careers@` — no evidence CaseWhy needs either yet; easy to add later the same way. `info@casewhy.com` stays the catch-all/registered developer address exactly as it is today (USCIS correspondence, etc.) — nothing here changes it.

**Peter: trim, rename, or add to this list before Claude Code starts** — it's cheap to change now, more work to rename after filters and code exist.

## Design recommendation: aliases, not separate mailboxes

Don't provision separate Workspace mailboxes for each alias. Two reasons this project already knows the hard way (see `CLOUD_CLAUDE.md` items 89/92): only `info@casewhy.com`'s real inbox is confirmed to actually send successfully, and neither this cloud session nor Claude Code has ever had Google Workspace admin credentials to create/manage mailboxes.

Instead:
1. **Add each address as a Workspace email alias on the existing `info@casewhy.com` user** (Workspace supports up to 30 free aliases per user, admin.google.com → Users → info@casewhy.com → email aliases). All alias mail lands in the same inbox Peter already knows works. **This step needs Peter to do it himself in the Workspace admin console** — flag it as a manual prerequisite, not something Claude Code can script without admin API access it doesn't have.
2. **Gmail filters, one per alias**, matching `To:` contains `<alias>@casewhy.com`, applying a distinct label (e.g., `Alias/Privacy`, `Alias/Security`) and skipping the inbox tab clutter if desired. Workspace aliases automatically become valid "send as" addresses on the same account with no extra verification, so replies can go out correctly *from* `privacy@casewhy.com` etc., not just `info@casewhy.com` — solves the reply-from-the-right-address problem for free.
3. **Code monitors via the Gmail API against these labels**, not thirty separate inboxes.

If Peter would rather have true separate mailboxes (e.g., for cleaner permissions later), say so and this gets rescoped — the above is the cheap, fast-to-ship default given what's already proven to work.

## What Claude Code builds

- **A per-alias config** (JSON or a DB table — match whatever convention the app already uses for settings) with, per alias: the Gmail label to poll, a monitoring interval (how often to check — these should differ; `security@`/`legal@` should probably be near-real-time, `feedback@` can be hourly or daily), and an action-eligibility level (`draft-only` — just prepare a suggested reply/action and hold it — vs `draft-and-flag-urgent` for anything under `security@`/`legal@`/`abuse@`). Make these editable without a code change (a config file or an admin-only settings row Peter can adjust), since "customizable how often to monitor and/or respond" was Peter's explicit point.
- **A polling job per alias** (reuse whatever cron infrastructure the app already has, e.g. the same pattern as `check-status/route.ts`'s existing cron) that reads new mail under that alias's label via the Gmail API, classifies/summarizes it, and drafts a proposed reply and/or proposed action (e.g., "mark this case-status text as flagged for correction," "log this as a data-deletion request due by X").
- **A pending-approval queue, not an auto-send/auto-act pipeline.** This is the one hard requirement: nothing drafted here is ever sent or executed automatically, full stop. Every drafted reply and every proposed action sits in a queue Peter can review, edit, approve, or reject. Simplest MVP, given this app is already a Next.js app with its own sign-in: a lightweight internal admin route (gated to Peter's account only) listing pending items per alias with Approve / Edit-then-approve / Reject actions. Flag this UI choice as the one open design call in this spec — if Peter would rather review these as literal Gmail drafts sitting in the `info@casewhy.com` Drafts folder instead of a new in-app screen, that's a simpler build and worth considering; note the tradeoff and pick one rather than building both.
- **On approval:** the actual send goes out from the correct alias address (via Workspace "send as," per the design above); the actual action (e.g., updating a flagged-correction record) executes only then.
- **Never bypass this for `legal@` or `security@` specifically** — those should generate an immediate alert to Peter (however the app already notifies him — email/push, whichever exists) rather than a routine queued item, given the stakes of missing a legal notice or a real vulnerability report.

## Out of scope this round

No auto-send or auto-action under any circumstance — that's not a future toggle, it's the whole point of "sent with my approval." No new mailboxes/Workspace accounts (aliases only, per the design above). No changes to `info@casewhy.com` as the registered USCIS developer contact. No press@/careers@ aliases unless Peter asks.

## Verify live

- Send a real test email to each new alias; confirm it lands in `info@casewhy.com`'s inbox with the correct label applied.
- Confirm a reply sent from the approval queue actually goes out with the alias address in `From:`, not `info@casewhy.com`.
- Confirm nothing drafted ever sends or executes without a real approval click — try leaving one pending and confirm it just sits there.
- Confirm `security@`/`legal@` mail triggers an immediate alert distinct from the routine queue.
