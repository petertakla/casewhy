# New task for Claude Code — round 42: source-tagging + a reusable full-refresh pipeline for Get Help directories

**Status: authorized now.** Peter's decision (Sep 9), after weighing round 41's report-a-listing approach: reporting-and-reviewing individual flags isn't feasible with his limited resources as a solo founder. Instead, the government/board-certification-sourced entity types get a **complete, automated periodic refresh** — full re-pull, re-parse, and re-seed on a schedule — rather than a diff that waits for manual review. Confirmed cadence: **quarterly for the DOJ-sourced lists** (accredited representatives + legal aid orgs, same source roster) and **annually for board-certified attorneys** (FL/TX/NC, round 40 — certification cycles run years, not months). Round 41's report-a-listing feature stays as-is (already shipped) as a secondary, passive signal; it's just not the primary freshness mechanism anymore.

**Updated Sep 9, same day — Peter's follow-up: every refresh takes a backup first, and that means a real backup/restore capability, not just a safety-check-and-hope.** This is the actual substitute for a human reviewing every change: instead of (or really, in addition to) refusing to apply an obviously-broken parse, every refresh snapshots exactly what it's about to overwrite, so a bad refresh — one that passes the count-sanity check but is still wrong in some way that check can't catch — is always recoverable, not just "hopefully caught in advance." See Part 4 below; it's not optional or a follow-up round, it ships with the rest of this one, since a refresh pipeline without a working restore path is the exact "no human review, no safety net" combination this whole design is trying to avoid.

This round builds the plumbing so those recurring refreshes are cheap, safe, and repeatable — not a one-off script each time. Applies to all six entity types' worth of sourced data over time, not just the three live today.

## Part 1 — tag every directory row by data source, retroactively

**Add a `data_source` column** (or equivalent — match existing naming conventions) to `accredited_representative_directory`, `legal_aid_directory`, and the `attorney_directory`/equivalent table (once round 40 seeds it), if it doesn't already exist. Values needed:
- `doj_eoir_roster` — for every row seeded from the DOJ EOIR roster (accredited representatives, legal aid orgs).
- `fl_bar_board_cert` / `tx_bls_board_cert` / `nc_bar_board_cert` — for attorney rows seeded per-state in round 40 (one value per state source, not a single generic "board_cert" — a future refresh needs to know which state's list to re-check each row against).
- `self_enrolled` — for any row that originated from a `/<type>/join` submission that was manually approved into the live directory, not from a bulk source pull.

**Backfill this on every row that already exists** — every accredited-representative and legal-aid-org row seeded so far came from the DOJ roster, so this is a straightforward one-time UPDATE, not a judgment call. Round 40's seed script should write the correct per-state value directly when it runs (check its status — if round 40 already shipped by the time this task starts, backfill its rows the same way).

**Why this matters, stated plainly:** the whole point of an automated *full* refresh is that it's safe to re-run without a human diffing every change first. That's only true if the refresh can positively identify which rows it's allowed to touch. Without this tag, a refresh script re-seeding "all accredited representatives" would have no way to distinguish a DOJ-sourced row from a self-enrolled one and could silently delete a real self-enrolled listing that happens to not appear in that quarter's DOJ pull. **This tag is what makes the refresh safe — do not skip it or treat it as optional schema decoration.**

## Part 2 — generalize the existing seed scripts into idempotent refresh scripts

Round 32/34/40 each already have a working one-time seed script (`scripts/seed-accredited-representatives.ts` and equivalents). Generalize each into a script that can be **re-run safely, any number of times**, and that only ever touches rows tagged with its own `data_source` value:

1. Re-download the source fresh (DOJ roster PDF; each state's board-certification page) — never reuse a previously-downloaded/cached copy, the whole point is to catch what changed.
2. Re-parse it with the existing, already-debugged parsing logic (reuse, don't rewrite — round 35's PDF-parsing bugs and their fixes are exactly the kind of thing that shouldn't need re-discovering).
3. **Back up first, before touching anything — see Part 4 for the mechanism.** Every refresh run's first real action (after the fresh parse succeeds) is snapshotting the exact current state of every row it's about to touch (every row carrying that script's `data_source` tag). This happens even if the count-sanity check in step 5 would otherwise pass — the backup isn't conditional on suspecting a problem, it's unconditional, every run.
4. Diff the fresh parse against the current DB rows carrying that script's `data_source` tag:
   - New entries in the source but not the DB → insert.
   - Entries in both, but changed (address, phone, status, expiration) → update.
   - Entries the source now shows lapsed, expired, or removed → remove from the live directory (or mark inactive, whichever the schema supports more cleanly — removing is simpler and matches "skip lapsed entries" already established at initial-seed time).
   - Entries tagged with a *different* `data_source` (self-enrolled, or a different state's board-cert list) → never touched, by construction.
5. Update the `pull_date` (or equivalent "last verified" field already required on every listing since round 29) to the refresh's actual run date on every row it touches.
6. **Built-in safety checks, same discipline as every prior seed round — the backup is the recovery path, this is the prevention path, run both:** cross-check the fresh parse's total count against the source's own stated total before applying anything; if the count is wildly different from the previous run (say, more than a 20% swing either direction) or parsing fails partway, **stop and don't apply the diff** — write a report and flag it rather than silently seeding a possibly-broken parse. A quiet zero-result or garbage parse applied automatically is exactly the failure mode this whole design needs to avoid.
7. Log a short summary each run (added/updated/removed counts, the backup id/timestamp created, any refresh that got stopped by the safety check) — append to `CLOUD_CLAUDE.md` or a dedicated log file, whichever fits better, so there's a real record of what each refresh actually did.

## Part 3 — backup + restore, the actual recovery path

**Added Sep 9 per Peter's direct instruction** — every refresh takes a backup first, and that implies real restore tooling, not just a table full of old snapshots nobody can act on.

### What gets backed up

A `directory_backups` table (or equivalent — one shared table across all entity types is simpler to operate than a separate one per type): entity type, `data_source` tag, the refresh run's timestamp, and a full snapshot of every row that tag had *immediately before* this run touched anything (a JSON blob of the rows is simplest — no need for a second normalized schema just for backups). No new infrastructure needed — this lives in the same Postgres/Neon database everything else does.

**Scope precisely**: only the rows a given refresh is about to touch (its own `data_source` tag) get backed up by that refresh — not the whole table, and never self-enrolled rows (a refresh never touches those, so there's nothing to back up for them here; if self-enrollment reconfirmation/editing gets built later, it can define its own backup step then).

### Retention

Keep a reasonable rolling window rather than growing forever — **suggest keeping the last 4 backups per `data_source`** (a year's worth at quarterly cadence, 4 years' worth at annual cadence) and pruning older ones automatically as part of each refresh run. Cheap to store (it's rows of text/JSON, not files or images), so this is a generous default, not a tight one — adjust if Peter wants more/less history.

### Restore capability

A restore script (`scripts/restore-directory-backup.ts` or equivalent) that takes a backup id (or entity type + timestamp) and **replaces the live rows currently carrying that `data_source` tag with the snapshot's contents** — the mirror image of a refresh, applied deliberately rather than on a schedule. This is an operational tool Claude Code runs on request (e.g., "restore accredited representatives to the backup from the Oct 1 refresh") — not something exposed in the app UI, and not something that runs automatically. Confirm before applying: show what a restore would change (row counts added back / removed) before actually applying it, same "show the diff before touching production" discipline as everything else in this project.

### Why this is the real safety net, not the count-sanity check alone

The safety check in Part 2 step 6 only catches problems big enough to show up as a large count swing — it won't catch, say, a source that quietly changed its page structure in a way that still parses to a plausible-looking (but wrong) result. A backup means that failure mode is recoverable after the fact, not just hopefully prevented in advance. This is what makes "no human reviews every diff" an acceptable trade for a solo founder's limited time, rather than just removing the safety net entirely.

## Part 4 — wire up the two schedules

This part doesn't need new product code — it needs two recurring prompts that tell a future Claude Code session (or this cloud session, which will push the resulting task doc) to run the relevant refresh script:

- **Quarterly**: run the DOJ-roster refresh (covers accredited representatives + legal aid orgs together, since they share the same source document — no need for two separate runs).
- **Annually**: run the attorney board-certification refresh (FL/TX/NC).

The cloud session is setting up the actual recurring triggers for this on its own side (not part of this repo task) — this round's job is just making sure the underlying scripts exist and work correctly when invoked, so those scheduled prompts have something real to call.

## Verify live

Run both refresh scripts once manually against production as part of this round (not just against a local/dev copy) to confirm the whole loop actually works end to end: `data_source` correctly backfilled and visible on every existing row, a manual re-run correctly identifies zero changes (since nothing in the source has actually changed since the initial seed) rather than erroring or wrongly flagging everything as new, the safety-check threshold behaves sensibly, self-enrolled rows (simulate one via a test join+approval if none exist yet) are confirmed untouched by a refresh run. **Also confirm the backup/restore loop specifically**: a real backup row lands in `directory_backups` on that manual run, its snapshot content matches what was live immediately before, and a real test restore (restore that same backup right back) correctly reproduces the pre-refresh state — don't just confirm the backup was written, confirm it can actually be read back and applied. `tsc`/lint clean, production build succeeds. Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
