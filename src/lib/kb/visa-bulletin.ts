// CW-34 — Dept. of State Visa Bulletin, Final Action Dates.
//
// Same constraint as processing-times.ts: travel.state.gov also sits behind
// a Cloudflare bot challenge that blocks a plain fetch (confirmed by
// testing), so this is a hand-captured snapshot from the real bulletin page
// (loaded in an actual browser, which passes the challenge fine), not a live
// scraper. Per CW-34's own note, this is the deliberate "Claude-assisted
// manual monthly update" alternative — refresh this file once a month by
// reading the new bulletin at the source URL below, rather than building a
// scraper against a site that actively blocks automated fetches.
//
// Final Action Dates (not Dates for Filing) are captured here — the chart
// that actually determines when a green card can be issued/adjustment
// approved, which is what CaseWhy's own users care about once they're past
// the filing stage.

export interface BulletinRow {
  category: string;
  label: string;
  allOther: string;
  china?: string;
  india?: string;
  mexico?: string;
  philippines?: string;
}

export const VISA_BULLETIN_MONTH = "September 2026";
export const VISA_BULLETIN_SOURCE_URL =
  "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2026/visa-bulletin-for-september-2026.html";

export const FAMILY_FINAL_ACTION: BulletinRow[] = [
  { category: "F1", label: "Unmarried sons/daughters of U.S. citizens", allOther: "22JAN20", china: "22JAN20", india: "22JAN20", mexico: "01JAN08", philippines: "01MAY13" },
  { category: "F2A", label: "Spouses/children of permanent residents", allOther: "22AUG26", china: "22AUG26", india: "22AUG26", mexico: "22AUG25", philippines: "22AUG26" },
  { category: "F2B", label: "Unmarried sons/daughters (21+) of permanent residents", allOther: "22AUG19", china: "22AUG19", india: "22AUG19", mexico: "15FEB09", philippines: "01JUN13" },
  { category: "F3", label: "Married sons/daughters of U.S. citizens", allOther: "22OCT14", china: "22OCT14", india: "22OCT14", mexico: "01JUL01", philippines: "22FEB06" },
  { category: "F4", label: "Siblings of adult U.S. citizens", allOther: "22OCT11", china: "22OCT11", india: "01NOV06", mexico: "08APR01", philippines: "22AUG07" },
];

export const EMPLOYMENT_FINAL_ACTION: BulletinRow[] = [
  { category: "EB-1", label: "Priority workers", allOther: "C", china: "01JUL23", india: "15OCT22", mexico: "C", philippines: "C" },
  { category: "EB-2", label: "Advanced degrees / exceptional ability", allOther: "C", china: "01SEP21", india: "U", mexico: "C", philippines: "C" },
  { category: "EB-3", label: "Skilled workers / professionals", allOther: "01SEP24", china: "01JAN22", india: "01JAN14", mexico: "01SEP24", philippines: "01AUG23" },
];

/** "C" = current (no wait once other requirements are met); "U" = unauthorized (no visas currently available). */
export function bulletinDateLabel(value: string): string {
  if (value === "C") return "Current";
  if (value === "U") return "Unavailable";
  return value;
}
