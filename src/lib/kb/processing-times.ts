// CW-33(a)/(c) — official USCIS processing-time figures.
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
// CW-33(c) (Sep 5, 2026) went further and tried to find a live JSON API
// this tool calls internally — the one documented by the open-source
// `coatless-r-n-d/uscis-processing` R package (`/processing-times/api/`)
// no longer exists (redirects to this same page). Confirmed via
// `read_network_requests` while driving the real form: the current tool
// POSTs back to its own page URL and returns server-rendered HTML, not
// JSON — there's no separate, lower-friction surface to build against.
// It's also why "all forms + any office" isn't attempted here: the tool
// has no bulk/export view, so covering that combinatorially would mean an
// unbounded number of individual manual lookups with no realistic refresh
// cadence — a different, impractical kind of effort, not just "more of the
// same." This file stays a deliberately small, curated set instead.
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
    id: "i140-e11",
    formType: "I-140",
    categoryLabel: "Extraordinary ability (EB-1)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 31,
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
  {
    id: "i751-removing-conditions",
    formType: "I-751",
    categoryLabel: "Removal of lawful permanent resident conditions (spouses of U.S. citizens/LPRs)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 33.5,
  },
  {
    id: "i90-10-year-renewal",
    formType: "I-90",
    categoryLabel: "10-year renewal",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 10.5,
  },
];

export const PROCESSING_TIMES_AS_OF = "2026-09-05";
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

/**
 * Confirmed Sep 5, 2026: I-130 *preference* categories (F1/F2A/F2B/F3/F4 —
 * anything except the Immediate-Relative category above) mostly don't get a
 * fixed months figure at all. SCOPS ties its own adjudication order to the
 * Visa Bulletin's own priority-date availability instead, and only posts a
 * number when a category is fully "Current" — otherwise the tool literally
 * responds "See notes" pointing back to the bulletin. Tested directly (F1
 * category) rather than assumed. This is why /visa-bulletin exists as its
 * own page — for these categories, it's the actually-relevant number, not
 * a months estimate.
 */
export const VISA_BULLETIN_TIED_NOTE =
  "Family preference categories (anything other than spouse/parent/child of a U.S. citizen) don't get a fixed processing-time estimate — USCIS ties its own adjudication order to the Visa Bulletin's priority dates instead, and only posts a number once a category is fully current. Check the visa bulletin for the number that actually applies.";

/**
 * Real USCIS office-locator pages, for form types/categories this file
 * can't give a fixed number for (field-office-dependent forms — see
 * FIELD_OFFICE_ONLY_FORMS — and ASC-dependent steps like biometrics).
 * Deliberately not a hand-built directory of the 92 field offices + 130
 * Application Support Centers themselves — that's real USCIS data that
 * changes over time and is already maintained officially; linking out to
 * it directly is more honest and more current than a copy CaseWhy would
 * have to keep in sync by hand.
 */
export const OFFICE_LOCATOR_URL = "https://www.uscis.gov/about-us/find-a-uscis-office/field-offices";
export const ASC_LOCATOR_URL = "https://www.uscis.gov/about-us/find-a-uscis-office/application-support-centers";

export function findProcessingTime(formType: string): ProcessingTimeEntry[] {
  return PROCESSING_TIMES.filter((e) => e.formType.toUpperCase() === formType.toUpperCase());
}
