# Terms of Service — asylum/DACA tightening, approved Sep 8

**Status: approved by Peter, ready for Claude Code to implement.** Prompted by the round-23 decision to expand case-type coverage to asylum (I-589) and DACA (I-821D) with a "go all-in, but strict guardrails, err on the side of safety" posture — Peter asked directly whether the Terms of Service could be tighter around this, and approved the three additions below. This tightens the existing Section 3/8/10 language for these two specific, higher-stakes form types; it does not rewrite or restructure the document, and it doesn't replace attorney review before launch.

Do not rewrite sections that aren't listed below — pull the current live text from `casewhy.com/terms.html` (or its source in the `main`-branch static site) as the base and insert only what's specified here, preserving the existing wording, tone, section numbering, and "Last updated" date convention everywhere else (just bump the date to reflect this change).

## 1. New subsection in Section 3 ("Not Legal Advice")

Insert as a new paragraph immediately after the existing first paragraph of Section 3 (the one starting "CaseWhy is not a law firm..."), before the second paragraph ("Decisions about your individual case..."):

> **Time-sensitive and higher-stakes matters (including asylum and DACA).** Some case types the Service covers — including asylum (Form I-589) and Deferred Action for Childhood Arrivals (Form I-821D) — involve strict filing deadlines, individualized eligibility determinations, and legal frameworks that can change with little notice, including active litigation currently affecting DACA. For these case types in particular, CaseWhy will never tell you whether you are eligible for relief, predict the outcome of your case, or tell you what to do about a deadline that may apply to your specific situation — it will only ever offer general information about how the applicable process works, and will direct you to a licensed immigration attorney whenever a question could depend on your individual facts, history, or timing. Because a missed deadline or an incorrect assumption in these areas can result in serious, sometimes irreversible consequences — including denial of relief or exposure to removal proceedings — you should not delay contacting a licensed immigration attorney or accredited representative based on anything CaseWhy tells you.

## 2. Amend Section 8 ("Third-Party Data and Services")

Append one sentence to the end of its existing content (after the existing "verify it against the original government or official source before acting on it" sentence):

> This is especially true for DACA, whose legal status is currently subject to ongoing federal litigation and could change with no advance notice from CaseWhy.

## 3. Amend Section 10 ("Disclaimers")

Append one sentence to the end of its existing content (after the existing "You use the Service, and any information or document you draft using it, at your own risk." sentence):

> This includes no warranty regarding your eligibility for, or the outcome of, any immigration benefit, relief, or protection from removal.

## Implementation notes

- Live page: `casewhy.com/terms.html`, on the static marketing site's `main` branch (same as the original round-7/round-10 build and the round-18 Terms/Privacy additions) — not the Next.js app repo.
- Match the page's existing visual style exactly (same header/nav, footer, typography) — this is a content addition, not a redesign.
- `terms.html` has no draft banner and is published as final/effective per Peter's existing decision (round 6/round 10) — these additions don't change that status, just bump the "Last updated" date.
- **Sequencing:** this should ship at or before round 23 (I-589/I-821D case-type coverage) goes live — the whole point is that these Terms cover the two form types before real users can ask the AI chat about them. If round 23 is built first, don't flip its case-type dropdown live to real users until this lands too.
- After deploying, report back the live URL so the cloud session can verify the page reads correctly end to end, same as round 18's close-out.
