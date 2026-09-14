# New task for Claude Code — round 95: standing order — check CLOUD_CLAUDE.md and the Round Status Tracker before numbering a round, then increment

**Status: authorized now, Sep 14. Peter's own instruction. This is a standing process rule, not a feature — add it to CLOUD_CLAUDE.md next to the round-88 rule, permanently.**

## The rule

**Before any session — Claude Code or the cloud session — assigns a round number to a new task, it checks both `CLOUD_CLAUDE.md` (source of truth) and the "CaseWhy — Round Status Tracker" Google Doc (the cloud-readable mirror) for the highest round number already used (headings, "Round NN" entries, and the standing-rule entries all count), takes the higher of the two, and uses the next integer.** No session assigns a number from memory, from the Ideas project's doc list, or from Drive filenames. If the two disagree, `CLOUD_CLAUDE.md` wins and the tracker gets corrected in the same sitting.

Practically:

1. `grep -o -E "[Rr]ound [0-9]+" CLOUD_CLAUDE.md | sort -t' ' -k2 -n | tail -1` (or equivalent), and read the tracker's last "Round NN+ is unclaimed" line — take the max of both.
2. New round = max + 1. If several task docs are being written in one sitting, reserve the block (e.g. "rounds 89–96") in the same sitting and say so in each doc's status line.
3. Claude Code, on picking up a task doc whose number is already taken, does **not** build under a colliding number: it renumbers to the next free one, notes the correction at the top of the doc and in its `CLOUD_CLAUDE.md` entry (the way round 85 did), and keeps going.
4. The cloud session can always read the tracker via Drive; it reads `CLOUD_CLAUDE.md` too whenever the `casewhy` folder is connected, and otherwise asks Peter to connect it (or state the current max) before numbering — never guesses from the tracker alone if it looks stale (its last update older than the newest task doc).

## Why this is a standing order

Sep 14: the cloud session scoped six marketing rounds as 73–78 from the Ideas project's doc list (which stopped at round 72) while the repo was already at round 88 — every number collided with shipped work, and rounds 82, 83 and 84 had each already been double-used the same way earlier in the week. Renumbering after the fact cost a full pass over every doc, the Gantt, and the guardrails. Checking one file first costs ten seconds.

## Also update

- The Round Status Tracker doc: add the rule to its header next to the round-88 rule, and keep "Round NN+ is unclaimed as of <date>" as the last line of every update — Claude Code updates it after every round ships, since it is the cloud session's primary check.

## Verify

No code. Confirm the rule is in `CLOUD_CLAUDE.md` and the tracker header, and that the tracker's last line now reads "Round 97+ is unclaimed", and apply it starting with this round's own number (95 was confirmed free against `CLOUD_CLAUDE.md` on Sep 14 — max was 88, rounds 89–94 reserved by the cloud session the same day, 96 reserved for the gated `links_enabled`/referral round).
