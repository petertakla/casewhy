# New task for Claude Code — round 113: social@casewhy.com for the social-media accounts, and Code-managed alias creation (so press@ and every future alias need no Peter step)

**Status: authorized now, Sep 16. Deadline before Wed Sep 17 09:00 ET. Peter's involvement: one 2-minute login-gated step (Part A, the scope grant) — plus, found mid-build, a second short login-gated step (enabling the Admin SDK API), and manual Gmail filter creation (a real API-scope gap, not a code bug).**

(Full spec — see the Drive doc `claude_round113-social-alias-and-code-managed-aliases-task` / CLOUD_CLAUDE.md's Round 113 entry for the complete original text.)

## Verify live

- social@casewhy.com and press@casewhy.com accept mail; each lands in info@'s inbox under the right label.
- ensure-alias.ts (via /api/admin/ensure-alias) run twice is a no-op the second time.
- Social Media/* Gmail labels exist under info@.
- A real end-to-end message (filter → label → poller → queue) confirmed for press@.

---

## Claude Code build notes (Sep 16, 2026) — DONE, fully verified live end-to-end

Built and deployed: real Directory API access (`src/lib/email-aliases/directory-client.ts`, `ensureAlias()`), a permanent admin route for future alias creation, and the `Social Media/*` Gmail labels matching Peter's own real structure.

**Three real blockers hit and cleared, each one layered on the last:**
1. The Admin SDK API blocker turned out to be an IAM/account issue — Peter was signed into Cloud Console with an account that wasn't an Owner on the `casewhy-aliases` project. Switching accounts and enabling it worked immediately.
2. `social@casewhy.com` and `press@casewhy.com` are real Workspace aliases — confirmed idempotent, confirmed accepting real mail.
3. The Gmail filter that labels incoming mail is blocked via the API (the known `gmail.settings.basic` gap from rounds 86/87) — Peter created both filters by hand in Gmail's Settings, the same real mechanism the original 12 aliases' filters almost certainly used.

**A fourth, unplanned discovery mid-build**: while creating the filters, Peter did a full Gmail label reorganization — deleted every old flat `Alias/*` label and replaced it with a new hierarchy (`Critical/*`, `Accounting/*`, `Public/*`, `Social Media/*`). This silently broke the poller for all 13 monitored aliases (not just press@/social@), since the DB still pointed at label names that no longer existed. Found by listing the real live labels directly, then updated all 13 `email_alias_configs` rows to match. Also corrected `setup-social-labels`'s label prefix and dropped the merged "Meta" label per Peter's own explicit instruction — Facebook, Instagram, and Threads each get their own label now.

**Verified live, end to end, for real**: a fresh test email to press@ → poll-aliases → a real row landed in `pending_alias_actions`. Test data cleaned up after confirming.
