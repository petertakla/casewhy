# New task for Claude Code — round 113: social@casewhy.com for the social-media accounts, and Code-managed alias creation (so press@ and every future alias need no Peter step)

**Status: authorized now, Sep 16. Deadline before Wed Sep 17 09:00 ET. Peter's involvement: one 2-minute login-gated step (Part A, the scope grant) — plus, found mid-build, a second short login-gated step (enabling the Admin SDK API).**

(Full spec — see the Drive doc `claude_round113-social-alias-and-code-managed-aliases-task` / CLOUD_CLAUDE.md's Round 113 entry for the complete original text.)

## Verify live

- social@casewhy.com and press@casewhy.com accept mail; each lands in info@'s inbox under Social/Other and Alias/Press respectively.
- ensure-alias.ts (via /api/admin/ensure-alias) run twice is a no-op the second time.
- Six Social/* Gmail labels exist under info@.
- /admin/inbox shows press@ mail with the Press label; nothing from social@ appears in the approval queue.

---

## Claude Code build notes (Sep 16, 2026) — PARTIAL, blocked on a real second Peter step

Built and deployed: real Directory API access (`src/lib/email-aliases/directory-client.ts`, `ensureAlias()`), a permanent admin route for future alias creation, and Part C's six `Social/*` Gmail labels (confirmed live). A real bug (an unhandled exception returning an empty 500 in production) was found and fixed the same round.

**Two real, honest blockers, not worked around:**
1. The catch-all filter is blocked by the same `gmail.settings.basic` scope gap rounds 86/87 already found — not new.
2. **A genuinely new blocker**: the Google Cloud project backing the service account has never had the Admin SDK API enabled — a project-level toggle distinct from the domain-wide-delegation scope Peter already granted. Needs his own Console login: `https://console.developers.google.com/apis/api/admin.googleapis.com/overview?project=958638978824` → Enable.

`social@casewhy.com` and `press@casewhy.com` don't exist yet as real aliases — purely blocked on step 2 above, otherwise the code path is confirmed correct (a real, specific Google error, not a bug). Will retry the moment Peter confirms the API is enabled.
