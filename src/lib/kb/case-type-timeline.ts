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

export const CASE_TYPES: CaseTypeOption[] = [
  {
    id: "n400",
    label: "Naturalization (N-400)",
    timelineBlurb: n400Note,
  },
  {
    id: "family-green-card",
    label: "Family-based green card (I-130 / I-485)",
    timelineBlurb: i130
      ? `The initial I-130 petition (Immediate Relative — spouse, parent, or child under 21 of a U.S. citizen) is currently taking around ${i130.percentile80Months} months for 80% of cases (Service Center Operations, as of ${PROCESSING_TIMES_AS_OF}). The follow-on I-485 adjustment stage is different: ${familyI485Note} Other family preference categories (siblings, married children, etc.) mostly don't get a fixed months figure at all — ${VISA_BULLETIN_TIED_NOTE}`
      : familyI485Note,
  },
  {
    id: "employment-based",
    label: "Employment-based (I-140 / I-485)",
    timelineBlurb:
      i140e1 && i140e2 && i485Employment
        ? `The I-140 petition stage varies a lot by category: around ${i140e2.percentile80Months} months for EB-2 when a visa is currently available, versus around ${i140e1.percentile80Months} months for EB-1 (Service Center Operations, as of ${PROCESSING_TIMES_AS_OF}). The I-485 adjustment stage that follows is around ${i485Employment.percentile80Months} months — but that SCOPS figure only covers EB-4/EB-5; EB-1/EB-2/EB-3 I-485s are adjudicated by field offices instead, with no published national aggregate.`
        : "Employment-based timelines vary significantly by preference category and whether a visa is currently available — see the Processing Times page for what CaseWhy has on file.",
  },
  {
    id: "i90",
    label: "Green Card renewal/replacement (I-90)",
    timelineBlurb: i90
      ? `I-90s are currently taking around ${i90.percentile80Months} months for 80% of cases (${i90.office}, as of ${PROCESSING_TIMES_AS_OF}). USCIS recommends filing up to 6 months before your card expires. Your filing receipt notice extends your expired card's validity for employment/I-9 purposes — this doesn't change your actual permanent-resident status, which doesn't change while an I-90 is pending.`
      : "See the Processing Times page for what CaseWhy has on file for I-90.",
  },
  {
    id: "i131",
    label: "Travel document — Advance Parole / Re-entry Permit (I-131)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for I-131 — see the Processing Times page for what CaseWhy has on file. One critical thing to know regardless of timeline: if you're requesting Advance Parole and you leave the U.S. before it's approved and in hand, USCIS considers the I-131 abandoned — and for pending I-485 applicants, an unauthorized departure can jeopardize the adjustment application too, not just the travel document.",
  },
  {
    id: "n600",
    label: "Certificate of Citizenship (N-600)",
    timelineBlurb:
      "No fixed national timeline figure sourced yet for N-600 — processing time varies widely by service center; see the Processing Times page for what CaseWhy has on file. N-600 doesn't grant citizenship — it requests proof for someone who is already a U.S. citizen by operation of law (through a citizen parent, either automatically at birth abroad or as a minor under the Child Citizenship Act of 2000).",
  },
  {
    id: "i765",
    label: "Employment Authorization Document (I-765)",
    timelineBlurb: i765PendingI485
      ? `Timelines vary a lot by eligibility category. One data point CaseWhy has: an I-765 based on a pending I-485 adjustment, category (c)(9), is currently taking around ${i765PendingI485.percentile80Months} months (${i765PendingI485.office}, as of ${PROCESSING_TIMES_AS_OF}). Other categories (asylum-based, DACA, OPT/STEM, etc.) can differ significantly — see the Processing Times page for what else CaseWhy has on file.`
      : "See the Processing Times page for what CaseWhy has on file for I-765.",
  },
  {
    id: "other",
    label: "Other",
    timelineBlurb:
      "We don't have a typical-timeline estimate for this yet — you can still track your case and use AI chat.",
  },
];
