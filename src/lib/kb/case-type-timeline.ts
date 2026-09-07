// Round 20, item 2 — a form-type dropdown for the case-add flow, replacing
// the source review doc's "auto-detect form type from receipt prefix" idea:
// the prefix (EAC, WAC, LIN, SRC, MSC, IOE, NBC, etc.) identifies the USCIS
// *service center*, not the form type, so there's no way to derive N-400 vs.
// I-485 vs. I-140 from the receipt number alone. This instead lets the user
// pick from the three case types CaseWhy actually supports (per the MVP
// scope doc) and surfaces a real, already-sourced typical-timeline blurb —
// built from the same PROCESSING_TIMES/FIELD_OFFICE_ONLY_FORMS data CW-33
// already verified, not a new or duplicated number.

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
];
