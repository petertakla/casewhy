// Round 20, item 2 — a form-type dropdown for the case-add flow, replacing
// the source review doc's "auto-detect form type from receipt prefix" idea:
// the prefix (EAC, WAC, LIN, SRC, MSC, IOE, NBC, etc.) identifies the USCIS
// *service center*, not the form type, so there's no way to derive N-400 vs.
// I-485 vs. I-140 from the receipt number alone. Surfaces a real, already-
// sourced typical-timeline blurb per type — built from the same
// PROCESSING_TIMES/FIELD_OFFICE_ONLY_FORMS data CW-33 already verified, not
// a new or duplicated number; a type with no sourced figure says so honestly
// rather than guessing one.
//
// Round 21 — expanded from the original 3 (N-400, family-based green card,
// employment-based) to 7, plus "Other": adds I-90, I-131, N-600, I-765. The
// selector is now required at case *registration* (trackCase(), not just
// this informational hint) — see TrackCaseButton.tsx and dashboard/actions.ts
// — so every tracked case has a real value to key explanation/chat/guardrail
// logic off, opening tracking up to anyone with a case, not just these three
// original categories. I-751, I-589, and I-821D are deliberately NOT here yet
// — see CLOUD_CLAUDE.md round 21 for why each needs its own dedicated review.
//
// Round 22 — adds I-129 (nonimmigrant worker petitions — H-1B, L-1, O-1, TN,
// etc.) and I-751 (removing conditions on residence, deferred from round 21).
// I-129 is a genuinely new population for CaseWhy: temporary/nonimmigrant
// workers, not people on a green-card/citizenship track — built generic
// across the visa classification (correctly, per its own note below: never
// assume which classification a case is without independent confirmation).
// The list is now 9 + "Other" — added a `group` field so the dropdown can be
// rendered as optgroups instead of one long flat list (see TrackCaseButton).
// I-589 and I-821D remain deliberately deferred to round 23, which requires
// Peter's personal review before shipping, given their materially higher
// stakes — see CLOUD_CLAUDE.md round 23.
//
// Round 23 — adds I-589 (asylum) and I-821D (DACA), the two highest-stakes
// case types added so far. Built per Peter's explicit "go all-in, but err
// on the side of safety" direction (Sep 8) after checking how competitors
// handle them (Lawfully supports both directly; VisaWatch supports
// neither). Facts re-verified fresh at build time given how fast both
// move — see the KB entries in policy-memos.ts for full sourcing and the
// hard-rule guardrails in explain.ts/chat.ts, which are deliberately
// stricter here than any other form type: decline and redirect to an
// attorney on anything close to the line, rather than a careful hedge.
// This round is not "done" until Peter has personally reviewed the real
// KB content and guardrail-test transcripts — see CLOUD_CLAUDE.md round 23.

import {
  findProcessingTime,
  FIELD_OFFICE_ONLY_FORMS,
  VISA_BULLETIN_TIED_NOTE,
  PROCESSING_TIMES_AS_OF,
} from "./processing-times";

export interface CaseTypeOption {
  id: string;
  label: string;
  timelineBlurb: string;
  /**
   * Round 22 — the list outgrew a flat dropdown; groups it into optgroups in
   * the UI. "other" (undefined) renders as a plain trailing option, not
   * inside any group — see TrackCaseButton.tsx.
   */
  group?: "Citizenship & status" | "Family-based" | "Employment-based" | "Travel & green card" | "Asylum & humanitarian";
}

const n400Note = FIELD_OFFICE_ONLY_FORMS.find((f) => f.formType === "N-400")!.note;
const familyI485Note = FIELD_OFFICE_ONLY_FORMS.find(
  (f) => f.formType === "I-485" && f.categoryLabel === "Family-based adjustment"
)!.note;
const i130 = findProcessingTime("I-130")[0];
const i140e1 = findProcessingTime("I-140").find((e) => e.categoryLabel.includes("Extraordinary"));
const i140e2 = findProcessingTime("I-140").find((e) => e.categoryLabel.includes("Advanced degree"));
const i485Employment = findProcessingTime("I-485").find((e) => e.categoryLabel === "Employment-based adjustment");
const i90 = findProcessingTime("I-90")[0];
const i765PendingI485 = findProcessingTime("I-765")[0];
const i751 = findProcessingTime("I-751")[0];

export const CASE_TYPES: CaseTypeOption[] = [
  {
    id: "n400",
    label: "Naturalization (N-400)",
    timelineBlurb: n400Note,
    group: "Citizenship & status",
  },
  {
    id: "n600",
    label: "Certificate of Citizenship (N-600)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for N-600 — processing time varies widely by service center; see the Processing Times page for what CaseWhy has on file. N-600 doesn't grant citizenship — it requests proof for someone who is already a U.S. citizen by operation of law (through a citizen parent, either automatically at birth abroad or as a minor under the Child Citizenship Act of 2000).",
    group: "Citizenship & status",
  },
  {
    id: "family-green-card",
    label: "Family-based green card (I-130 / I-485)",
    timelineBlurb: i130
      ? `The initial I-130 petition (Immediate Relative — spouse, parent, or child under 21 of a U.S. citizen) is currently taking around ${i130.percentile80Months} months for 80% of cases (Service Center Operations, as of ${PROCESSING_TIMES_AS_OF}). The follow-on I-485 adjustment stage is different: ${familyI485Note} Other family preference categories (siblings, married children, etc.) mostly don't get a fixed months figure at all — ${VISA_BULLETIN_TIED_NOTE}`
      : familyI485Note,
    group: "Family-based",
  },
  {
    id: "i751",
    label: "Removing conditions on residence (I-751)",
    timelineBlurb: i751
      ? `I-751s are currently taking around ${i751.percentile80Months} months for 80% of cases (${i751.office}, as of ${PROCESSING_TIMES_AS_OF}). File within the 90 days immediately before your 2-year conditional card expires (joint petitions). Missing that window is serious, not a soft deadline: your conditional status automatically terminates and USCIS can start removal proceedings — late filing is only possible with a written good-cause explanation, and approval isn't guaranteed. If you're divorced, widowed, were abused during the marriage, or would face extreme hardship, you may be able to file a waiver instead — without the other spouse, and without the 90-day window restriction.`
      : "See the Processing Times page for what CaseWhy has on file for I-751.",
    group: "Family-based",
  },
  {
    id: "employment-based",
    label: "Employment-based green card (I-140 / I-485)",
    timelineBlurb:
      i140e1 && i140e2 && i485Employment
        ? `The I-140 petition stage varies a lot by category: around ${i140e2.percentile80Months} months for EB-2 when a visa is currently available, versus around ${i140e1.percentile80Months} months for EB-1 (Service Center Operations, as of ${PROCESSING_TIMES_AS_OF}). The I-485 adjustment stage that follows is around ${i485Employment.percentile80Months} months — but that SCOPS figure only covers EB-4/EB-5; EB-1/EB-2/EB-3 I-485s are adjudicated by field offices instead, with no published national aggregate.`
        : "Employment-based timelines vary significantly by preference category and whether a visa is currently available — see the Processing Times page for what CaseWhy has on file.",
    group: "Employment-based",
  },
  {
    id: "i129",
    label: "Nonimmigrant worker petition (I-129 — H-1B, L-1, O-1, TN, etc.)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for I-129 — timelines vary a lot by visa classification (H-1B, L-1, O-1, TN, and others) and service center; see the Processing Times page for what CaseWhy has on file. One important fact regardless of timeline, specific to H-1B: once a new or transfer I-129 petition is properly filed and receipted, you can generally start working for the new employer right away — you don't need to wait for approval — provided you're maintaining valid status (or within the 60-day grace period after your last job ended), the new employer's Labor Condition Application is certified, and you have no history of unauthorized work. If that petition is later denied, work authorization under it ends immediately.",
    group: "Employment-based",
  },
  {
    id: "i765",
    label: "Employment Authorization Document (I-765)",
    timelineBlurb: i765PendingI485
      ? `Timelines vary a lot by eligibility category. One data point CaseWhy has: an I-765 based on a pending I-485 adjustment, category (c)(9), is currently taking around ${i765PendingI485.percentile80Months} months (${i765PendingI485.office}, as of ${PROCESSING_TIMES_AS_OF}). Other categories (asylum-based, DACA, OPT/STEM, etc.) can differ significantly — see the Processing Times page for what else CaseWhy has on file.`
      : "See the Processing Times page for what CaseWhy has on file for I-765.",
    group: "Employment-based",
  },
  {
    id: "i131",
    label: "Travel document — Advance Parole / Re-entry Permit (I-131)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for I-131 — see the Processing Times page for what CaseWhy has on file. One critical thing to know regardless of timeline: if you're requesting Advance Parole and you leave the U.S. before it's approved and in hand, USCIS considers the I-131 abandoned — and for pending I-485 applicants, an unauthorized departure can jeopardize the adjustment application too, not just the travel document.",
    group: "Travel & green card",
  },
  {
    id: "i90",
    label: "Green Card renewal/replacement (I-90)",
    timelineBlurb: i90
      ? `I-90s are currently taking around ${i90.percentile80Months} months for 80% of cases (${i90.office}, as of ${PROCESSING_TIMES_AS_OF}). USCIS recommends filing up to 6 months before your card expires. Your filing receipt notice extends your expired card's validity for employment/I-9 purposes — this doesn't change your actual permanent-resident status, which doesn't change while an I-90 is pending.`
      : "See the Processing Times page for what CaseWhy has on file for I-90.",
    group: "Travel & green card",
  },
  {
    id: "i589",
    label: "Asylum (I-589)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for I-589 — see the Processing Times page for what CaseWhy has on file. Must generally file within one year of arrival, with real exceptions for changed or extraordinary circumstances — never something to assess without an attorney. Affirmative asylum (filed with USCIS) and defensive asylum (raised in immigration court, under EOIR, not USCIS) are different processes — if you're not sure which applies to you, ask an attorney rather than assume. As of September 2026, the wait for an initial work permit (EAD) is roughly 150 days after filing (approximate, not exact) — a DHS rule proposed in February 2026 would extend this to 365 days, but it remains proposed, not finalized, as of this writing.",
    group: "Asylum & humanitarian",
  },
  {
    id: "i821d",
    label: "DACA (I-821D)",
    timelineBlurb:
      "As of this writing, USCIS is processing DACA renewals only — it is not accepting or processing new initial applications, so a first-time DACA case genuinely isn't possible right now. DACA's legal status is still being litigated: a federal appeals court found its work-authorization component may be unlawful, and the case has been sent back to a district court for a decision that, as of this writing, hasn't been issued — the outcome and timing are genuinely unresolved, not something CaseWhy can predict.",
    group: "Asylum & humanitarian",
  },
  {
    id: "other",
    label: "Other",
    timelineBlurb:
      "We don't have a typical-timeline estimate for this yet — you can still track your case and use AI chat.",
  },
];
