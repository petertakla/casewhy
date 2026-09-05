// CW-33(a) — official USCIS processing-time figures.
//
// IMPORTANT, and why this is a small hand-captured table rather than a live
// scraper: egov.uscis.gov/processing-times sits behind Cloudflare's bot
// challenge — confirmed by testing (a plain HTTP fetch, with a realistic
// browser User-Agent, gets a Cloudflare "Attention Required" page, not the
// tool). A real browser passes the challenge fine, so this data was pulled
// by actually loading the tool and reading its output, not scraped
// programmatically — the same constraint applies to a Vercel serverless
// function, which would very likely get the same block a plain fetch does.
// A live "periodic fetch/parse job" as CW-33 first assumed isn't a realistic
// v1 here; a periodic *manual* (Claude-assisted, using a real browser)
// refresh is. Same reasoning applies to CW-34's visa bulletin data.
//
// Each entry is deliberately narrow and precisely labeled — USCIS's own tool
// returns very different numbers depending on form category and adjudicating
// office (e.g. an I-485's number depends heavily on employment- vs
// family-based, and even then employment-based SCOPS figures only cover
// EB-4/EB-5, not EB-1/2/3 — see the note on that entry). Presenting a single
// simplified number per form type would be actively misleading, so entries
// are kept as specific as the tool itself requires, and anything not covered
// here is left for the user to look up directly rather than guessed at.
//
// USCIS is also mid-transition away from naming a specific service center
// (e.g. "Vermont Service Center") toward a consolidated "Service Center
// Operations (SCOPS)" bucket for forms it applies to — per the tool's own
// on-page alert as of this writing. That's a real, current caveat on
// `serviceCenter()` in src/lib/ai/explain.ts: receipt-number prefixes still
// map to the historical centers, but USCIS's own processing-time reporting
// no longer breaks out by that prefix for most forms.

export interface ProcessingTimeEntry {
  id: string;
  formType: string;
  categoryLabel: string;
  office: string;
  percentile80Months: number;
  note?: string;
}

export const PROCESSING_TIMES: ProcessingTimeEntry[] = [
  {
    id: "i130-immediate-relative",
    formType: "I-130",
    categoryLabel: "U.S. citizen filing for a spouse, parent, or child under 21 (Immediate Relative)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 24,
  },
  {
    id: "i140-e21",
    formType: "I-140",
    categoryLabel: "Advanced degree or exceptional ability (EB-2)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 2.5,
    note: "SCOPS prioritizes I-140s when the Visa Bulletin shows a visa currently available for that category/date; doesn't apply to premium-processed petitions, which follow the premium processing timeframe instead.",
  },
  {
    id: "i485-employment-based",
    formType: "I-485",
    categoryLabel: "Employment-based adjustment",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 40,
    note: "This SCOPS figure only covers EB-4 and EB-5 cases. EB-1/EB-2/EB-3 employment-based I-485s are adjudicated by field offices instead, and USCIS doesn't publish a single aggregate for those — check the official tool with your specific field office.",
  },
  {
    id: "i765-pending-i485",
    formType: "I-765",
    categoryLabel: "Based on a pending I-485 adjustment application, (c)(9)",
    office: "National Benefits Center",
    percentile80Months: 11,
  },
];

export const PROCESSING_TIMES_AS_OF = "2026-09-04";
export const PROCESSING_TIMES_SOURCE_URL = "https://egov.uscis.gov/processing-times/";

/**
 * Cases USCIS reports only by field office (varies by the applicant's local
 * office, which nothing in the Case Status API tells us) — N-400 and
 * family-based I-485 chief among them. Surfaced so the UI can explain the
 * gap honestly instead of silently omitting those form types.
 */
export const FIELD_OFFICE_ONLY_FORMS = [
  { formType: "N-400", note: "Every N-400 is adjudicated by the applicant's local field office, so there's no single national number — USCIS's tool requires picking your specific field office." },
  { formType: "I-485", categoryLabel: "Family-based adjustment", note: "Family-based I-485s are field-office adjudicated, same as N-400 — no SCOPS aggregate exists for this category." },
];

export function findProcessingTime(formType: string): ProcessingTimeEntry[] {
  return PROCESSING_TIMES.filter((e) => e.formType.toUpperCase() === formType.toUpperCase());
}
