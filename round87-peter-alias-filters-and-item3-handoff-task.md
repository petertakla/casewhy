# New task for Claude Code — round 87: build the peter@ label/filter setup directly; clarify the item-3 handoff point

**Status: authorized now, Sep 14.** Following up on round 86's report listing "three things left for Peter." Peter's admin@ alias was his own instruction alongside peter@ — no clarification needed there, both aliases exist and are confirmed intentional. Two of the three items in that report need a direct correction; the third is genuinely Peter's step, unchanged.

## Item 2 (peter@ Gmail alias + platform labels) — this is Claude Code's task, not Peter's. Build it now.

**There is no technical reason this needs Peter to do it manually.** Round 70 already established and proved the mechanism: Gmail labels and filters can be created directly via the Gmail API using the domain-wide delegation credentials already set up for info@casewhy.com's dozen aliases — server-to-server, no login, no password, no manual console interaction required. peter@casewhy.com is just another alias on the same Workspace user; the exact same API calls that created info@'s labels/filters apply here.

**Build, per round 85/86's original spec:** nested labels Peter/Reddit, Peter/Facebook, Peter/Quora, etc. under peter@casewhy.com, with filters matching mail to that address from each platform's real notification-sending domain (verify each domain against a real email from that platform before building the filter — don't guess). Use the same credentials and the same API calls already working for info@'s filters. If something about domain-wide delegation genuinely doesn't extend to a second alias the same way — a real technical limitation, not a preference to hand this off — report that specifically, with the actual error, rather than deferring to Peter as the default when a task is inconvenient.

## Item 1 (Reddit API app) — correctly Peter's step, no change. Exact steps for Peter:

1.  Go to **https://www.reddit.com/prefs/apps** while signed into the personal Reddit account created for this (the one tied to peter@casewhy.com).
2.  Scroll down, click "create app" (or "create another app").
3.  Name it something internal-only (e.g. "CaseWhy Community Assistant") — no one else sees this name.
4.  Select type **"script"** — correct for automated, read-only monitoring, not a public-facing app.
5.  Reddit requires a redirect URI even for script apps — enter http://localhost. Leave description/about URL blank.
6.  Click "create app."
7.  Copy the **client ID** (the unlabeled string shown right under the app's name/type) and the **secret** (explicitly labeled "secret").
8.  Send both to Claude Code to wire in as environment variables.

This stays Peter's action because it requires a real Reddit account agreeing to Reddit's own developer terms under a human identity — consistent with round 85's original framing that third-party account/app creation is inherently manual.

## Item 3 (cron-job.org registration) — split the handoff correctly. Exact steps for Peter:

1.  Claude Code got to **https://cron-job.org**'s login page and found Peter's password pre-filled, but correctly won't submit it on his behalf — this is an intentional safety boundary, not something to override.
2.  Peter goes to **https://cron-job.org** himself, confirms it's the same account already used for the other two CaseWhy cron jobs, and clicks login (password should already be pre-filled from saved credentials — this is a single click, not manual typing).
3.  Once logged in, Peter tells Claude Code he's in.
4.  **Claude Code then takes over immediately** and registers /api/cron/poll-community as a new job on that account, matching the setup of the two existing jobs — no further action needed from Peter.

## Verify live

Send a real test email to peter@casewhy.com from each platform's actual sending domain (or trigger a real notification from an already-created account) and confirm it lands under the correct nested label — same verification bar round 86 already set, not weakened here. Confirm the /api/cron/poll-community job is actually registered and running on schedule once Peter completes the login handoff. Report back plainly on what was actually built directly versus what genuinely still needs Peter, and why — don't default to "left for Peter" without a real, stated reason next time. Fold into CLOUD_CLAUDE.md's standing status, referencing rounds 70, 85, and 86.
