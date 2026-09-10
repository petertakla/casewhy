# New task for Claude Code — round 64: build the "For Employers" page — rich content, lead-capture form, structured for multiple future features

**Status: authorized now, Sep 10.** Peter's ask, verbatim, after we talked through what this category should eventually do: "let's start with the form but provide rich content to prepare for multiple functions." This is the 6th and last Get Help entity type — already scoped as a lead-capture page, not a directory, back when the six categories were laid out (`partner-marketing-domain-concept.md`), and still sitting as the one "coming soon" placeholder in `src/lib/get-help/entity-types.ts` (`id: "employers"`, `href: null`, `status: "coming-soon"`). There's no team-accounts product feature built yet and none is being built this round — this is the content-rich lead-capture page, with the interest form itself structured to double as real product-prioritization data once submissions start coming in.

**The honesty line for this whole page, stated once here because it applies everywhere below:** every capability described is something CaseWhy is *considering building*, not something live. The copy needs to read as a roadmap pitch and an honest ask for input — never as "sign up for your dashboard," which would overclaim a feature that doesn't exist. Frame consistently as "we're building" / "planned" / "here's what this could look like," never present tense as if available today.

## Page content — use this copy as the draft, adjust only for house style consistency with the other five entity-type pages

**Headline:** "For employers"

**Subhead:** "You're sponsoring — or thinking about sponsoring — employees through the immigration process. We're building tools to make that easier for your team."

**Problem framing (one short paragraph):** "Most companies sponsoring H-1B, PERM, or other work-authorization cases track them the way spreadsheets always have — a shared file, scattered emails, and manually checking each case one at a time. Meanwhile the employee already has a clearer picture on their own CaseWhy dashboard. Right now you don't see it."

**"What we're building" section — six items, each a short label + one-line description, styled as a real feature list (not vague marketing bullets):**
1. **Team dashboard** — "One view across every sponsored employee's case status, built only from cases each employee has chosen to share with your team — never pulled without their consent."
2. **Deadline calendar** — "EAD expirations, visa expirations, OPT/STEM OPT windows, and other key dates for your whole team, in one place instead of one spreadsheet row at a time."
3. **Stalled-case alerts** — "Know the moment a sponsored case goes quiet longer than expected, so you can act — before an employee's authorization lapses."
4. **Visa bulletin alerts for your team** — "See at a glance which sponsored employees just became eligible to file the next step, instead of checking each priority date by hand."
5. **Plain-language digests** — "A weekly summary written for HR, not immigration lawyers — what changed, and what, if anything, needs your attention."
6. **Export & reporting** — "Pull the dates and statuses that matter into a spreadsheet or calendar whenever you need them."

**Trust/privacy line, its own visually distinct block (same treatment as an existing disclaimer box elsewhere in the app, not buried in body text):** "Nothing here works without your employees' consent. Any future team dashboard will only ever show what an employee explicitly chooses to share — CaseWhy doesn't sell data, run ads, or grant an employer access to a case without the person it belongs to opting in."

**Free line, matching the "this is free" requirement already used on every other Get Help page:** "Telling us what you need costs nothing and carries no obligation — this is what helps us build the right thing first, instead of guessing."

## The form — structured interest capture, not just a free-text box

Fields:
- **Company name** (required, text)
- **Your name** (required, text)
- **Your role** (required, text — placeholder example: "HR generalist, immigration/mobility manager, general counsel, etc.")
- **Work email** (required, email)
- **Approximately how many employees do you sponsor or expect to sponsor?** (required, select: "1-5", "6-20", "21-50", "51+", "Not sure yet")
- **Which of these would help your team most?** (checkboxes, multi-select, matching the six feature items above one-to-one, plus an "Other" option) — **this is the real point of structuring the form this way**: every submission tells Peter which planned feature has real demand, not just that someone is interested in general. Store each selection as its own structured value (an array/jsonb column, not a concatenated string), so it's actually queryable later.
- **Anything else you'd want from this?** (optional, free text)
- Honeypot field, same invisible-to-real-users pattern already used on every other `/join` form (see `src/app/legal-aid/join/ApplicationForm.tsx` for the exact pattern to copy).

No sign-in required — same posture as every other `/<type>/join` page. Submit button: "Send interest." Success state: "Thanks — we'll use this to help decide what to build first. We'll reach out if it's a good fit to try early." (Don't promise a specific timeline or guarantee outreach — keep it honest about being early-stage interest, not a waitlist with a committed date.)

## Backend

New table (e.g. `employerLeads`) — this is a leads table, not a directory-and-applications pair like the other five entity types, since there's no public listing here at all. Fields: `companyName`, `contactName`, `contactRole`, `contactEmail`, `teamSizeRange`, `interests` (array/jsonb of the selected feature keys), `otherNeeds` (nullable text), `submittedAt`. A Postmark notification to Peter on each submission, same pattern as every other self-enroll flow (round 28 established this — no per-type admin dashboard needed at this volume, same call applies here).

## Wiring

- New page, `/employers` (check for a route collision first — none seen in the current `src/app` tree, but verify directly rather than assuming).
- Flip `src/lib/get-help/entity-types.ts`'s `employers` entry: `href: "/employers"`, `status: "live"`, and add a real `whenToUse` line (draft: "You're an employer or HR/mobility team supporting employees through the immigration process, or exploring tools for your team.") — since both the Get Help hub's static list and round 60's chooser (`GetHelpChooser.tsx`) already read from this one shared module, confirm both surfaces pick this up correctly rather than assuming they do just because the data changed.
- Check whether `casewhy.com`'s static-site Get Help section (round 38, extended round 61) also separately lists "Employers" as a coming-soon entry there — if so, update it too, same "grep for every hardcoded mention rather than trusting memory" discipline every prior entity-type round has needed.

## Verify live

Submit a real test entry through the live form — confirm it lands correctly in the new table with the structured `interests` values intact (not flattened into a single string) and that a real Postmark notification fires. Confirm the Get Help hub card and the chooser's employer branch both now link to a real, working `/employers` page instead of showing "Coming soon." Re-read the shipped page copy once live and confirm nothing on it reads as an existing feature rather than a planned one — this is the one thing worth double-checking by eye, not just by code review. `tsc`/lint clean, production build succeeds.
