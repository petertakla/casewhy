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
  // Round 106 — per-entry, replacing the single global constant below
  // (kept, but now derived as the max of these rather than hand-set
  // independently, so it can't quietly drift from what each entry
  // actually says). Set to the date each figure was actually re-driven
  // from the live USCIS tool, not just "whenever this file last changed."
  asOf: string;
}

export const PROCESSING_TIMES: ProcessingTimeEntry[] = [
  {
    id: "i130-immediate-relative",
    formType: "I-130",
    categoryLabel: "U.S. citizen filing for a spouse, parent, or child under 21 (Immediate Relative)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 24,
    asOf: "2026-09-15",
  },
  {
    id: "i140-e11",
    formType: "I-140",
    categoryLabel: "Extraordinary ability (EB-1)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 31,
    asOf: "2026-09-15",
  },
  {
    id: "i140-e21",
    formType: "I-140",
    categoryLabel: "Advanced degree or exceptional ability (EB-2)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 2.5,
    note: "SCOPS prioritizes I-140s when the Visa Bulletin shows a visa currently available for that category/date; doesn't apply to premium-processed petitions, which follow the premium processing timeframe instead.",
    asOf: "2026-09-15",
  },
  {
    id: "i485-employment-based",
    formType: "I-485",
    categoryLabel: "Employment-based adjustment",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 40,
    note: "This SCOPS figure only covers EB-4 and EB-5 cases. EB-1/EB-2/EB-3 employment-based I-485s are adjudicated by field offices instead, and USCIS doesn't publish a single aggregate for those — check the official tool with your specific field office.",
    asOf: "2026-09-15",
  },
  {
    id: "i765-pending-i485",
    formType: "I-765",
    categoryLabel: "Based on a pending I-485 adjustment application, (c)(9)",
    office: "National Benefits Center",
    percentile80Months: 11,
    asOf: "2026-09-15",
  },
  {
    id: "i751-removing-conditions",
    formType: "I-751",
    categoryLabel: "Removal of lawful permanent resident conditions (spouses of U.S. citizens/LPRs)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 33.5,
    asOf: "2026-09-15",
  },
  {
    id: "i90-10-year-renewal",
    formType: "I-90",
    categoryLabel: "10-year renewal",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 10.5,
    asOf: "2026-09-15",
  },
  // Round 106 — the five forms the case-add dropdown (case-type-timeline.ts)
  // already offered but this page never sourced a figure for.
  {
    id: "i131-advance-parole",
    formType: "I-131",
    categoryLabel: "Advance Parole, for a pending I-485 adjustment applicant",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 24,
    note: "The tool combines Re-entry Permits and Refugee Travel Documents into one separate category — see the next entry — rather than breaking them out individually.",
    asOf: "2026-09-15",
  },
  {
    id: "i131-reentry-refugee-travel",
    formType: "I-131",
    categoryLabel: "Re-entry Permit or Refugee Travel Document",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 16,
    note: "USCIS's own tool reports these two together as a single category, not separately.",
    asOf: "2026-09-15",
  },
  {
    id: "i129-h1b",
    formType: "I-129",
    categoryLabel: "H-1B specialty occupation, extension of stay in the U.S. (regular processing)",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 11,
    note: "I-129 covers many other classifications (H-2A/B, L, O, P, Q, R, TN, etc.) and H-1B itself has separate categories for a visa issued abroad and a change of status, which can run differently — this is one representative figure, not the only I-129 timeline. Premium processing is 15 business days by statute for most classifications (30 for I-765, 45 for I-140 E13/E21 NIW) — see USCIS's own premium processing page rather than a captured figure here, since it's a fixed statutory number, not a variable one this tool tracks.",
    asOf: "2026-09-15",
  },
  {
    id: "i821d-daca-renewal",
    formType: "I-821D",
    categoryLabel: "DACA renewal",
    office: "Service Center Operations (SCOPS)",
    percentile80Months: 6.5,
    note: "Renewals only — USCIS is not accepting or processing new initial DACA applications as of this writing (see the I-821D case-type note).",
    asOf: "2026-09-15",
  },
];

// Round 106 — derived from the entries above (the max asOf) rather than
// hand-set as its own independent value, so this can't quietly drift out
// of sync with what the entries themselves actually say.
export const PROCESSING_TIMES_AS_OF = PROCESSING_TIMES.reduce(
  (max, e) => (e.asOf > max ? e.asOf : max),
  PROCESSING_TIMES[0].asOf
);
export const PROCESSING_TIMES_SOURCE_URL = "https://egov.uscis.gov/processing-times/";
export const PREMIUM_PROCESSING_URL = "https://www.uscis.gov/forms/all-forms/how-do-i-request-premium-processing";

// Round 106 — an entry is stale once any single figure is more than this
// many days past its own asOf; the page shows one muted factual line
// (not a red warning) once that's true for any entry. The CI age script
// warns earlier (35 days) so staleness shows up in every build log well
// before it's visible to a real visitor.
export const STALENESS_THRESHOLD_DAYS = 45;

export function daysSince(isoDate: string): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function hasStaleEntry(): boolean {
  return PROCESSING_TIMES.some((e) => daysSince(e.asOf) > STALENESS_THRESHOLD_DAYS);
}

export interface FieldOfficeOnlyForm {
  formType: string;
  categoryLabel?: string;
  note: string;
  // Round 106 — N-400/family I-485 rely on the page's shared field-office/
  // ASC locator links below; I-589 needs a third, different locator (the
  // asylum office locator isn't a field office or an ASC), so this is
  // per-entry rather than another shared constant only some entries use.
  locatorUrl?: string;
  locatorLabel?: string;
  locatorLabelEs?: string;
}

/**
 * Cases USCIS reports only by field office (varies by the applicant's local
 * office, which nothing in the Case Status API tells us) — N-400 and
 * family-based I-485 chief among them. Surfaced so the UI can explain the
 * gap honestly instead of silently omitting those form types.
 */
export const FIELD_OFFICE_ONLY_FORMS: FieldOfficeOnlyForm[] = [
  { formType: "N-400", note: "Every N-400 is adjudicated by the applicant's local field office, so there's no single national number — USCIS's tool requires picking your specific field office." },
  { formType: "I-485", categoryLabel: "Family-based adjustment", note: "Family-based I-485s are field-office adjudicated, same as N-400 — no SCOPS aggregate exists for this category." },
  // Round 106 — confirmed directly: N-600 isn't a SCOPS/NBC form in the
  // tool at all, only ~90 individual field offices to choose from (same
  // shape as N-400, just a longer office list).
  {
    formType: "N-600",
    note: "N-600 is adjudicated by the applicant's local field office, same as N-400 — the tool has no national aggregate for it, only individual field offices to pick from.",
  },
  // Round 106 — confirmed directly: I-589 isn't in the Case Processing
  // Times tool's own Form list at all, not even as a field-office-only
  // entry. Affirmative asylum cases are scheduled by individual asylum
  // offices on their own docket, not tracked in this tool at any level —
  // never invent a figure for it.
  {
    formType: "I-589",
    note: "I-589 isn't in USCIS's Case Processing Times tool at all as of this writing — affirmative asylum interviews are scheduled by the individual asylum office handling the case, on that office's own docket, not tracked here at any level. Use the Asylum Office Locator to find and contact the office with jurisdiction.",
    locatorUrl: "https://egov.uscis.gov/office-locator/#/asy",
    locatorLabel: "Asylum Office Locator",
    locatorLabelEs: "Buscador de Oficinas de Asilo",
  },
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
