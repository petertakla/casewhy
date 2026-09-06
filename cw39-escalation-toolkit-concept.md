# CW-39 — Escalation Toolkit: Concept & Workflow

**Status: authorized to build, Sep 6, 2026** — Peter reviewed this concept, answered the four open questions below (see "Decided," below the walkthrough), and then directly authorized building the whole thing (round 12 in `CLOUD_CLAUDE.md`), not just an estimate. This is additive to the existing CaseWhy Plus bundle, not a replacement: unlimited chat and 5-case tracking stay exactly as decided in Section 6 of the MVP scope doc; CW-39 is a third thing bundled into the same $9.99/mo tier, per that section's own stated intent ("future ideas... are expected to fold into this same tier as they ship, not spawn new price points").

## The gap this fills

Unlimited chat answers a question you already know to ask. Multi-case tracking helps when the problem is visibility across cases. Neither helps at the actual worst moment — when a case goes quiet past a milestone and there's genuinely nothing more the AI can tell you, because USCIS hasn't told anyone anything. That's the moment this targets.

## Two parts, working together

**Part A — the "stalled case" detector (new, small).** CaseWhy already polls each tracked case daily and knows its full status history, including dated milestones like interview and oath-ceremony-scheduled events (this is existing CW-33 data infrastructure, not new). Add a simple rule layer on top: if a case has passed a milestone (interview held, ceremony scheduled) and gone N days with no further status change — N benchmarked against CW-33's own processing-time data, not an arbitrary number — surface a distinct "This case looks delayed" card on the dashboard, instead of waiting for the user to notice on their own.

**Part B — the toolkit itself (CW-39 as originally scoped).** Two connected tools, gated to Plus:
1. **Representative lookup** — the user enters a mailing address once; CaseWhy resolves it to a congressional district (Census Bureau Geocoding API) and returns their House rep and two senators with district-office contact info, from a small hand-maintained table (refreshed on the ~2-year election cycle, same pattern as the CW-31/33/34 knowledge base).
2. **Inquiry letter assistant** — pre-filled with facts CaseWhy already has on file for the tracked case (receipt number, filing date, interview/ceremony date, current status), plus a short prompt asking the user for their own reason the delay matters to them (a job, travel plans, family reunification). The assistant organizes and polishes what the user provides into a formal constituent-services letter — it never invents case-specific claims on its own, matching the same legal-framing rule as the explanation layer and chat.

## Concrete walkthrough (illustrative — not you, a hypothetical Plus subscriber)

Maria tracks her N-400 in CaseWhy (Plus tier, already using multi-case tracking for herself and her husband). She had her interview in March. It's now July — 120 days later, no status change.

1. **Day 120:** the stalled-case detector fires (typical post-interview-to-decision range for her office, per CW-33 data, is well under 120 days). Her dashboard shows a new card: *"Your case has had no update for 120 days since your interview — longer than typical for your office. Here's what you can do."* This card is free on every tier (decided below).
2. She taps **"Find my representative"** (Plus). Enters her mailing address once (encrypted at rest, same standard as her receipt number — this is the one genuinely new PII category, and needs the privacy-policy update already flagged in Section 5 before it ships). Sees her House rep and two senators, with district-office phone/email/web-form links.
3. She taps **"Draft an inquiry letter"** (Plus). CaseWhy shows her a template already filled in with her receipt number, filing date, interview date, and current status — all pulled from data it already has, nothing re-typed. It asks one short question: *"What's this delay actually costing you?"* She writes two sentences about a planned trip to see her mother. CaseWhy turns this into a polished, properly-formatted constituent-inquiry letter addressed to her rep's office.
4. She downloads it, mails it herself (CaseWhy doesn't send anything on her behalf — she stays in control of what goes out, under her own name).
5. **14 days later:** CaseWhy nudges her again — *"It's been 2 weeks since you drafted your inquiry letter. Typical response time is 2-4 weeks. Still no update on your case. Want to draft a follow-up to your local field office, or look at the USCIS Ombudsman's Case Assistance program next?"* — now offering the other two templates (decided below) rather than just the one.

This mirrors Peter's own real sequence (congressional inquiry → written follow-up → Ombudsman awareness) rather than inventing a new one — it's turning a path he had to discover for himself into something the product hands a user proactively.

## What's genuinely new to build vs. already exists

**Reused, not rebuilt:** the daily status-poll/diff job, the case-history data model, the KB's "hand-curated, periodically refreshed" pattern (now applied to a rep-lookup table instead of policy memos), the AI-drafting infrastructure already proven in the chat (CW-32) and the attorney-handoff report (CW-40).

**Actually new:** the stall-detection rule itself; the Census Geocoding integration; the rep/senator table and its refresh cadence; a new encrypted PII field (mailing address) plus the privacy-policy update it requires; three letter/request-drafting prompts and their guardrail testing (same adversarial-testing bar CW-32 already went through, applied to a new surface).

## Decided — Sep 6, 2026

1. **"Stalled" is benchmarked per-office/per-form against CW-33's own processing-time ranges**, not a fixed day count. More accurate, and it's the more work of the two options — CW-33(a)'s existing data is the input, so this is a real dependency on that data staying current, not new data collection.
2. **The letter/inquiry assistant covers all three of Peter's real escalation paths**, not just the congressional one: (a) a congressional-inquiry letter to the rep's office, (b) a formal written follow-up to the local field office, and (c) a USCIS Ombudsman Case Assistance request. Same "organize and polish the user's own content, never invent case-specific claims" rule applies to all three.
3. **The "your case looks delayed" awareness card is free**, visible to every tier. Only the representative lookup and the three letter/request drafting tools are Plus-gated. This keeps the delay-detection itself in line with CaseWhy's trust positioning (surfacing the problem honestly regardless of payment) while still putting the actual escalation tools behind the same paid tier as everything else.
4. **No price change.** CW-39 folds into the existing $9.99/mo CaseWhy Plus tier alongside unlimited chat and 5-case tracking — consistent with Section 6's "one bundled tier, not a menu" decision.

## Next step

**Authorized to build now (Sep 6, later) — round 12 in `CLOUD_CLAUDE.md`.** Not just an estimate: Peter reviewed this concept and gave the go-ahead to build it as part of the full CaseWhy Plus tier, alongside CW-35/36/37/38/40 — everything short of a live payment/checkout flow (see round 12 for the exact boundary). The effort notes above are informal, not a formal estimate — flag plainly during the build if any piece (especially the stall-detection benchmarking or the three-template drafting assistant) turns out bigger than these notes imply.
