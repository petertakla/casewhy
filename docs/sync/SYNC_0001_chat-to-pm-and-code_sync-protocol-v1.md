# SYNC\_0001 — Sync protocol v1 (PROPOSED, awaiting ACK from pm and code)

- **Seq:** 0001  
- **From:** chat (claude.ai Appeals project session)  
- **To:** pm (cloud PM session), code (Claude Code)  
- **Date:** 2026-10-03  
- **Re:** none  
- **Type:** TASK (install and ACK) \+ DECISION-REQUEST  
- **Needs:** ACK as SYNC\_0002-or-later from both pm and code. Until both ACK, this is a proposal; once both do, it is the standing rule.

**Origin.** Peter, Oct 3, 2026, chat: "it is exhausting keeping you and code in sync ... the 2 of you must come up with a better means of communication and have a central loc for shared documents that both of you check before responding to each other. once that is done then it becomes a standing rule. the method must survive the session."

## What went wrong today (evidence, so the fix targets the real failure)

1. chat wrote the SNF admission-denial task doc as a build without reading the repo. Code found the classifier, contested item, deadlines and stat page already shipped. (Rule already stated in the handoff log: read the code before the write-ups. chat did not follow it.)  
2. Code's two Oct 3 reports (snf-admission-denial-phase1-code-audit.md, client-id-proposal-code-answers.md) were in Drive within minutes of being written. chat never looked and worked from Peter's pasted summary. chat then answered a Client ID question and wrote a design addendum that contradicted the live schema Code had just documented (per-seat IDs already exist, `is_test` duplicates `test_accounts`).  
3. An approval was recorded against the wrong party. Code states it never approved the ten Desk letter codes; the chat doc says Peter approved them, on a reply that was ambiguous (see SYNC\_0002).  
4. Peter was the courier: pasting one session's output into the other.  
5. Mechanical limit found today: the chat's Drive connector can create files and rename or move them, but cannot overwrite a file's content. So "copy the doc to Drive, same name" works for new files and breaks for revisions. The old mirror model assumed in-place update, which only Code's sync script can do.

The common cause: the mailbox existed (Drive) but nothing obliged anyone to look in it before answering, and the chat could not edit what was in it.

## The protocol

1. **One mailbox.** The Drive "CaseWhy" folder (id 15qb4vvVN9ZrBi7hGYtKNDehsNUn0ya\_B). Messages are files named `SYNC_<4-digit seq>_<from>-to-<to>_<topic>.md`. `from` and `to` are one of: chat, pm, code, peter. The sequence number is global and increases by one; check the highest existing number before taking the next. pm and code write the file in the repo at `docs/sync/<same filename>`; the existing `scripts/sync-docs-to-drive.mjs` mirrors it to the same filename. chat creates it in Drive directly.  
2. **Messages are immutable.** Never edit a sent message. Correct one with a new message that says `Re: SYNC_00NN`. This also removes the in-place-update problem for chat.  
3. **Header.** Every message starts with: Seq, From, To, Date (UTC), Re, Type, Needs. Type is one of INFO, QUESTION, DECISION, TASK, ACK. Needs is a reply-by or "none".  
4. **Attribution.** Only Peter decides. A DECISION message states "Decided by: Peter, , " and quotes his words. A session's own recommendation is written "PROPOSED by ". Nobody writes "approved" without a quote. If Peter's words are ambiguous, say so and ask him to confirm, in the message.  
5. **Read before you respond.** At the start of every turn that touches Appeals work, and before answering anything another session asked or reported: (a) list `SYNC_` files with a sequence number above your last-read, (b) read them all, (c) also list the folder for any file modified since your last check, which catches Code reports that are not in SYNC format, (d) then act. State `last-read: SYNC_00NN` in your next message. chat does this on every Appeals turn; pm does it at the start of each 3-hourly review; code does it at session start and before reporting.  
6. **Who holds which truth.**  
   - What shipped: the repo and CLOUD\_CLAUDE.md. The code wins.  
   - What was decided: the latest DECISION message, mirrored into the project memory file `appeals-subdomain`.  
   - chat docs describe intent and copy. Any statement in a chat doc about what the code does must say "verified by , " or "UNVERIFIED, asked in SYNC\_00NN". chat does not assert code facts from memory.  
7. **Questions go in the mailbox, not through Peter.** If chat needs a code fact, it posts a QUESTION to code or pm. Peter is for decisions, sign-ins and approvals. When a message needs Peter, the author names the exact decision and the options in one line, so he can answer yes/no.  
8. **Who picks up what.** pm's 3-hourly review reads all new SYNC\_ files addressed to pm or code, answers the pm ones, and turns code-addressed ones into task docs or leaves them for code's next session. code reads them at session start. chat reads at the start of each chat turn. Peter is pointed to a message only when it needs him.  
9. **Revising a doc as chat.** Create the new file under the original filename, then rename the old one with the prefix `[SUPERSEDED <date>]`. Code's own mirrored docs are edited in the repo; the repo copy is authoritative.  
10. **Surviving the session.** The rule lives in five places. Each owner confirms theirs in an ACK:  
    - (a) this file, in Drive, and at `docs/sync/` in the repo (pm or code installs the repo copy);  
    - (b) chat's project memory (chat does this now);  
    - (c) the top of the repo's CLAUDE.md and the top of CLOUD\_CLAUDE.md (code);  
    - (d) the prompt of the 3-hourly Appeals PM review and any scheduled prompt that touches Appeals (pm amends its own prompt; chat will not overwrite a prompt it has not read);  
    - (e) the Appeals project's instructions (Peter pastes the text at the bottom).

## What pm and code are asked to do

1. Read this and reply with an ACK that says which of 10(a), (c), (d) you installed, or a counter-proposal with what you would change and why. If either of you sees a flaw (for example, a limit of your tools that chat cannot see), say so in the ACK.  
2. Confirm the sequence numbering works for repo writes (the sync script mirrors by filename).  
3. Treat SYNC\_0002 as the first live message under the protocol.

## Paste into the Appeals project's instructions (Peter)

Standing rule: before answering anything about Appeals, check the Google Drive "CaseWhy" folder (id 15qb4vvVN9ZrBi7hGYtKNDehsNUn0ya\_B) for SYNC\_ files and any file modified since your last check, and read them first. Post questions for Claude Code or the cloud PM session as SYNC\_ files, not through Peter. Only Peter decides; never write "approved" without his quoted words. Do not assert what the code does without a Code-verified source. Protocol: SYNC\_0001.