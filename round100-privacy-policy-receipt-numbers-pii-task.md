# New task for Claude Code — round 100: Privacy Policy — disclose receipt numbers as PII (USCIS Torch review requirement)

**Status: authorized now, Sep 15 — blocks USCIS production API access; do this before 98/99 if they haven't started. Per round 95, confirm 100 is free against `CLOUD_CLAUDE.md` before building.**

## The requirement (verbatim from Torch Developer Support, Sep 14, 8:37 PM)

> We have reviewed your Privacy Policy. The policy does not address your collection and use of receipt numbers from users. Because USCIS considers receipt numbers to be Personally Identifiable Information (PII), your Privacy Policy must clearly disclose that receipt numbers are collected and treated as PII. Please include a brief summary explaining how receipt numbers are used to query case status updates, as well as how they are stored, safeguarded, and protected from unauthorized access or disclosure.

## What the live policy says today (fetched Sep 15)

`www.casewhy.com/privacy.html`, effective Sep 6 / last updated Sep 11. Section 1 mentions "the USCIS receipt number(s) you add" once; Section 4 says the USCIS API is used "to retrieve your case's status using the receipt number you provide"; Section 5 says "Case and account data is encrypted both at rest and in transit." Nowhere does it say receipt numbers are PII, describe the safeguards, or state who can access them. The reviewer is right.

## What is actually true in the code (verified in `src/lib/db/schema.ts`, Sep 15 — re-verify each claim before shipping the text; do not publish anything the code doesn't do)

- `tracked_cases.receipt_number` is stored as **AES-256-GCM ciphertext** (`src/lib/db/crypto.ts`), application-level, before it reaches the database. Same for the account email and last status text on that row.
- `case_status_history` stores only the **3-letter service-center prefix**, never the full receipt number.
- The AI explanation call receives status text only, never the receipt number (policy Section 4 already says this — confirm it's still true after rounds 63/66).
- Confirm and state: where the encryption key lives (env secret separate from the DB, presumably `vercel env`), that the database provider encrypts at rest and connections are TLS, and **whether an ad-hoc lookup without tracking (signed-out or untracked receipt number) is stored anywhere at all** — logs, `anonymous_question_usage`, request logging. If any transient store exists, the text must say so and state its retention.
- Confirm who can read plaintext: the account owner via the app, and the automated status-check job. State whether an admin can decrypt a user's receipt number and under what circumstances (support request only, logged?). If there is no admin decrypt path, say so — that's a strong statement to make.
- Attorney-handoff PDF and document vault: the PDF includes the receipt number by design (it's for the user's attorney); say so.

## Exact text to add — new Section 2, "USCIS Receipt Numbers Are Personal Information," inserted after Section 1; renumber 2–11 to 3–12 and grep both branches (`terms.html`, `faq`, ToS cross-references, `TERMS_OF_SERVICE_DRAFT.md`, code comments) for privacy section-number references and update them

> **2. USCIS Receipt Numbers Are Personal Information**
>
> A USCIS receipt number identifies a specific immigration case and the person it belongs to. USCIS treats receipt numbers as personally identifiable information (PII), and so do we. This section explains exactly what we do with them.
>
> **What we collect.** The receipt number(s) you enter to look up or track a case. We never obtain receipt numbers from anyone but you.
>
> **How we use them.** A receipt number is used for one purpose: to query USCIS's official Case Status API on your behalf and retrieve that case's status and history. For a case you have chosen to track, our automated status-check job re-queries USCIS with the receipt number once a day (or on demand if you use "Check now" on CaseWhy Plus) and compares the result to the last status we saw, so we can notify you of a change. We do not use receipt numbers for advertising, analytics, profiling, or any purpose other than retrieving your case status and showing it to you. The AI service that generates plain-language explanations receives the status text only — never your receipt number.
>
> **How we store them.** For a tracked case, the receipt number is encrypted in our application using AES-256-GCM before it is written to the database, with the encryption key held separately from the database as a protected secret. The database itself is additionally encrypted at rest by our hosting provider, and every connection between your browser, our servers, our database, and USCIS is encrypted in transit (TLS). Our case-history records store only the three-letter USCIS service-center prefix of a receipt number, never the full number. [Code to confirm and insert: whether receipt numbers looked up without tracking are stored — e.g., "A receipt number you look up without tracking it is used only to perform that lookup and is not stored."]
>
> **Who can access them.** Your receipt number is decrypted only to display your case to you when you are signed in and to run the status check for a case you track. [Code to confirm and insert one of: "No CaseWhy staff member can view your receipt number in plaintext through any administrative tool." / "A CaseWhy administrator can decrypt a receipt number only to resolve a support request you have made, and every such access is logged."] We do not share receipt numbers with any third party other than USCIS itself, for the sole purpose of the status query described above. If you generate an attorney-handoff report or store documents in your case's vault (CaseWhy Plus), your receipt number appears in that report and those files belong to you; we do not send them anywhere.
>
> **How long we keep them.** As long as the case is tracked in your account. When you stop tracking a case, its receipt number is deleted; when you delete your account, all receipt numbers and case data are permanently deleted within 30 days (see Section 6).
>
> **Unauthorized access or disclosure.** If we become aware of a security incident affecting your receipt number or case data, we will notify you without undue delay, as described in Section 6.

Also update the **Section 1 "Case information" bullet** to end with "— see Section 2 for how receipt numbers are protected," and in **Section 6 (was 5)** add one sentence: "Receipt numbers receive the additional application-level encryption described in Section 2."

## Dates, acknowledgment, and the other domain

- Bump "Last updated" to the ship date; keep "Effective: September 6, 2026."
- Section 10 (now 11) promises that a material change is emailed and actively acknowledged at next sign-in. This is a material change. Trigger round 69's policy-acknowledgment gate for the new version and send the plain-language summary email to existing account holders ("We've added a section explaining how your USCIS receipt number is protected; nothing about how we handle it has changed").
- `app.casewhy.com` links to `casewhy.com/privacy.html` — confirm there is no second copy of the policy anywhere in `nextjs-app` that would now be stale.
- No Spanish privacy page exists (rounds 78–79 kept Terms/Privacy English-only pending attorney review); leave it that way, no translation this round.

## Verify live

- The new section renders on `www.casewhy.com/privacy.html` with the effective/updated dates; section-number cross-references resolve; `validate-jsonld.mjs` still passes on `main`.
- Every factual claim in the new section is traced to a specific file/line in a comment in the round's `CLOUD_CLAUDE.md` entry (crypto, key location, history-table prefix, AI payload, ad-hoc lookup non-persistence, admin decrypt path).
- Acknowledgment gate shows the new version to an existing test account exactly once; the summary email arrives.
- Report back the final published text so Peter can reply to Torch with a link and the section number.

---

## Claude Code build notes (Sep 15, 2026)

Shipped as described, with two real corrections found while verifying rather than assumed from the task doc's own suggested text:

1. **The suggested "How we use them" paragraph overclaimed.** It says receipt numbers are used for "one purpose" and that the AI service "receives the status text only — never your receipt number." True for the case-explanation feature, false for `src/lib/ai/escalation-letter.ts`'s congressional/field-office/Ombudsman letter-drafting tool (CaseWhy Plus), which sends both the receipt number and the user's mailing address to the same AI service so the letter can state them. Rewrote the paragraph to disclose this explicitly, and also tightened the existing "Third-Party Services" AI bullet (Section 4→5, one section outside this round's literal scope but directly adjacent and now internally inconsistent if left alone) to stop promising "we do not send your full account or contact details," which the letter-drafting feature doesn't honor.
2. **The mechanical section-renumber missed two bare-digit cross-references.** `<h2>` headings were renumbered by string match, but two `<li>` items cited "Section 4" as a bare number rather than by heading text ("using an AI service (see Section 4)" and "listed in Section 4," both meaning the old Third-Party Services section) — both now correctly say Section 5. Caught by a full `grep -n "Section [0-9]"` sweep of the finished file, not assumed correct from the renumber script's own success.

Both bracketed placeholders in the task doc's suggested text were filled with the strong option: no admin decrypt path exists anywhere in the codebase (confirmed by grepping every `decryptField()` call site), and ad-hoc/untracked lookups are never written to CaseWhy's own database (confirmed via `src/app/dashboard/page.tsx`'s `recordCaseHistory()` gating) — worded as "not stored in our database" rather than an unqualified "not stored anywhere," since the lookup form is a GET request and the receipt number would still appear in the hosting platform's own low-level request logs, which is outside this application's code and not something the repo can promise about.

Production's `neon_auth."user"` table has zero real rows (confirmed via a temporary, deploy-then-delete diagnostic route) — matches round 69's own note that this was already true then. The acknowledgment-gate mechanism was verified instead against a disposable fixture account (insert → exercise → delete) rather than a real signed-up user, since none exist yet. `scripts/send-policy-update-notice.ts` is built and ready (dry-run by default, `--send` to fire for real) but wasn't run against production this round, since there's currently nobody to notify.

Full build/verify-live writeup: see `CLOUD_CLAUDE.md`, "Round 100."
