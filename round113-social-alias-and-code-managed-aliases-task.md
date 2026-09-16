# New task for Claude Code — round 113: social@casewhy.com for the social-media accounts, and Code-managed alias creation (so press@ and every future alias need no Peter step)

**Status: authorized now, Sep 16. Deadline before Wed Sep 17 09:00 ET. Peter's involvement: one 2-minute login-gated step (Part A, the scope grant) — plus, found mid-build, a second short login-gated step (enabling the Admin SDK API).**

(Full spec — see the Drive doc `claude_round113-social-alias-and-code-managed-aliases-task` / CLOUD_CLAUDE.md's Round 113 entry for the complete original text.)

## Verify live

- social@casewhy.com and press@casewhy.com accept mail; each lands in info@'s inbox under Social/Other and Alias/Press respectively.
- ensure-alias.ts (via /api/admin/ensure-alias) run twice is a no-op the second time.
- Six Social/* Gmail labels exist under info@.
- /admin/inbox shows press@ mail with the Press label; nothing from social@ appears in the approval queue.

---

## Claude Code build notes (Sep 16, 2026) — DONE except one manual Gmail-filter step

Built and deployed: real Directory API access (`src/lib/email-aliases/directory-client.ts`, `ensureAlias()`), a permanent admin route for future alias creation, and Part C's six `Social/*` Gmail labels (confirmed live). A real bug (an unhandled exception returning an empty 500 in production) was found and fixed the same round.

**Two real blockers hit and cleared, in order:**
1. The Admin SDK API blocker turned out to be an IAM/account issue, not a project-config one — Peter was signed into Cloud Console with an account that wasn't an Owner on the `casewhy-aliases` project (showed "Request access," not "Enable"). Switching to the right account and enabling it worked immediately.
2. `social@casewhy.com` and `press@casewhy.com` are now real Workspace aliases — confirmed idempotent (second call returns `created:false`), confirmed accepting real test mail (sent from ptakla@gmail.com, no bounce).

**One real, honest thing left open**: the Gmail filter that would auto-label incoming `press@`/`social@` mail is still blocked by the exact `gmail.settings.basic` scope gap rounds 86/87 already found — a completely different scope than the Directory API fix above, unaffected by it. Mail lands in info@'s main inbox, just unlabeled, until Peter creates two filters by hand in Gmail's own Settings (same 2-minute action as the original 12 aliases, which were almost certainly set up the same manual way — not by this codebase's own `createFilter()`, which has likely never actually worked).
