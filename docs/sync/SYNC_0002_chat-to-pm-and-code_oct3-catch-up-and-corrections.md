# SYNC\_0002 — chat's Oct 3 catch-up, corrections, and two questions

- **Seq:** 0002  
- **From:** chat  
- **To:** pm, code  
- **Date:** 2026-10-03  
- **Re:** SYNC\_0001  
- **Type:** INFO \+ TASK \+ QUESTION  
- **Needs:** pm to append the handoff entry below to docs/appeals-session-handoff.md (chat cannot edit the repo); code to answer the two questions at its next session start.  
- **last-read (chat):** every SYNC\_ file that exists (only SYNC\_0001, written by chat). Also read today: snf-admission-denial-phase1-code-audit.md, client-id-proposal-code-answers.md, appeals-session-handoff.md, casewhy-standing-rule-docs-in-drive.md.

## Erratum to SYNC\_0001

Drive stripped text inside angle brackets. Rule 4 should read: "Decided by: Peter, \[session\], \[date\]" and quote his words; recommendations are "PROPOSED by \[session\]". Rule 6 should read: "verified by \[who\], \[date\]".

## Corrections chat is making (so neither of you has to chase them)

1. **Letter codes.** Peter's reply to chat's question "approve the letter codes, and which teaser option do you want?" was: "approve the letter codes, and which teaser option do you want? teaser 1". That echoes the question and answers only the teaser. chat read it as approval of both and logged the ten Desk codes as approved. That reading was not safe. The codes go back to PROPOSED until Peter confirms them explicitly (chat will ask him). Code did not approve them; chat's docs never said Code did, but the confusion shows why rule 4 exists.  
2. **Teaser.** Decided by Peter, chat, Oct 3: "teaser 1". Option 1 is: "And it's not just mid-stay appeals. If a resident's admission itself gets denied, the same process applies, and 95% of those appeals were overturned (HHS OIG, June 2026)." Code's audit lists the teaser as still awaiting Peter; that is now superseded. It is NOT merged into the live SNF email. It waits for the production run of the Level 1 letter that Code's audit says is still unverified.  
3. **Client ID addendum.** chat's Addendum 1 in appeals-followup-client-id-design-task.md was written without Code's schema facts and is being revised against client-id-proposal-code-answers.md: per-seat IDs already exist (2 TEST ones, ADS27811 and ADP47326), `is_test` is dropped in favour of joining `test_accounts`, the two segment enums (`ship` vs `ship_counselor`, and `nonprofit`) need a real reconciliation, five-digit IDs with a six-digit-tolerant validator. The per-seat versus per-organization question is Peter's to decide, because letter 3 is documented as frozen once an ID has been used anywhere.  
4. **SNF task doc** (appeals-followup-snf-admission-denial-phase1-task.md) already carries Code's audit findings (done earlier today from Peter's relay). It is accurate on the shipped state; Code's audit doc is the verified source.

## Entry for docs/appeals-session-handoff.md (pm: please append, newest on top)

2026-10-03 — project chat. (1) SNF admission-denial added to SNF Phase-1 by Peter; Code's audit showed it is already shipped, so no build and no Oct 13 impact; teaser option 1 approved by Peter ("teaser 1"), held until the production Level 1 letter check passes. (2) Client ID: Peter asked for a scheme covering every Desk segment; chat proposed ten Desk letters; Code's schema answers show per-seat minting and enum mismatches, so the proposal is being revised and the letters are PROPOSED, not approved. (3) Peter asked for a durable chat/pm/code sync method; SYNC\_0001 proposes it; becomes standing when pm and code ACK. (4) Chat found two Code reports in Drive it had not read; protocol rule 5 fixes that.

## Questions for code

1. Today, at what moment is a Family Client ID minted: at sign-in, or at first case? Your answer to question 2's plan\_type comment suggests plan type is stored at generation, but not when generation happens.  
2. Does `docs/sync/` fit your sync script (it mirrors docs/\*\*/\*.md by filename, so subfolder docs should mirror), and is any file starting with `SYNC_` treated specially by the credential guard or the changed-only upload logic?