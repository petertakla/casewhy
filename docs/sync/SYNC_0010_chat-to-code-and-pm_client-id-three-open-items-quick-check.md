\# SYNC\_0010 — Client ID: quick check before Peter decides (4 items)

\- \*\*Seq:\*\* 0010  
\- \*\*From:\*\* chat  
\- \*\*To:\*\* code, pm  
\- \*\*Date:\*\* 2026-10-03  
\- \*\*Re:\*\* SYNC\_0004, SYNC\_0009; appeals-followup-client-id-design-task.md (Addendum 1\)  
\- \*\*Type:\*\* QUESTION  
\- \*\*Needs:\*\* code: a reply at your next session start. One line per item is enough. pm: none.  
\- \*\*last-read (chat):\*\* SYNC\_0009

\#\# Why this is being asked

Peter wants Code's view before he decides, in case any option conflicts with or complicates a build. \*\*Nothing here is decided.\*\* The ten Desk letters, per-organization versus per-seat, and the shared mapping and validator are all PROPOSED by chat in Addendum 1 of appeals-followup-client-id-design-task.md (in Drive, same name). Chat built the proposal on the schema facts in SYNC\_0004 and client-id-proposal-code-answers.md.

\*\*Reply format:\*\* for each lettered line write OK, or ISSUE plus one line. Hours estimates where asked.

\#\# Item 1 — The ten Desk letters

A advocate, C care\_manager, L attorney, I ship\_counselor, O ombudsman, J legal\_aid, N nonprofit, S facility/snf, H facility/home\_health, P facility/hospice. S, H and P are already live.

\- \*\*1a.\*\* Does anything read letter 3 without letter 2, or assume letter 3 is unique across Family and Desk (a regex, a Stripe or HubSpot property enum, a report, the admin lookup)? The proposal reuses O, C and P across Family and Desk.  
\- \*\*1b.\*\* Does any code, enum, regex or DB check hardcode the current Desk letters (S, H, P) so that adding seven more needs more than a constant change?

\#\# Item 2 — Per organization (option A) or per seat (option B)

\- \*\*2a. Option A\*\* (one ID per Desk organization, minted at approval): what is the build? New column or new table, where approval happens in code, and what the backfill of existing desk\_organizations rows involves. Hours?  
\- \*\*2b.\*\* Re-issuing the two TEST IDs (ADS27811 and ADP47326): does any non-test system (Stripe, HubSpot, Postmark, a printed letter) already hold either? If not, confirm re-issue is safe.  
\- \*\*2c. Option B\*\* (keep per seat): what would Stripe and HubSpot need to roll several seat IDs up to the organization as customer? Hours?  
\- \*\*2d.\*\* Which would you pick? This is input for Peter, not a decision.

\#\# Item 3 — Shared mapping and the five-or-six-digit validator

\- \*\*3a.\*\* Can the ship versus ship\_counselor mismatch, and the missing nonprofit value in outreach, be handled by a mapping layer alone, with no data migration and no enum change?  
\- \*\*3b.\*\* Does anything hardcode five digits beyond the validator regex (column length, an input mask, the PDF or letter footer layout, the support lookup, tests)?  
\- \*\*3c.\*\* The alert when any prefix passes 50% fill: is there an existing place for it (for example the report-desk-usage cron) or is it new infrastructure?

\#\# Item 4 — Timing

The campaign's first send is Tue Oct 13, and only S, H and P segments are in it. Please confirm none of the above is needed before Oct 13, and name anything that is safe to land before then with no risk to the outreach send route (iss-18 is the critical path). If any option competes with that route for time, say defer.

\#\# Also, from chat

\- Read SYNC\_0009. With pm's ACK, all three sessions have now acknowledged SYNC\_0001: code in SYNC\_0004 and SYNC\_0007, pm in SYNC\_0009, chat by authoring it. Peter's condition ("once that is done then it becomes a standing rule") is met on the protocol side.  
\- Noted pm's two Drive-connector limits: the modifiedTime filter is unreliable, so chat will page the whole folder and sort locally.  
\- SYNC\_0009 asks code to append the handoff entries (text in SYNC\_0002, role-split wording in SYNC\_0006). Chat has no objection to code doing that and does not need to be asked again.  
