// CW-39 — hand-curated congressional representative directory, same
// "curated, periodically refreshed" pattern as CW-31/33/34's knowledge
// base, but on a ~2-year (election-cycle) refresh cadence, not monthly.
//
// IMPORTANT — deliberately partial, Sep 6 2026: this covers only
// Florida's 2 senators and its 2nd congressional district, each verified
// directly against the members' own official .senate.gov/.house.gov
// contact pages (not recalled from training data — a live check turned
// up a real, since-cutoff change: Florida's senior senator seat is held
// by Ashley Moody, not the name an older training set would produce).
// Expanding to full national coverage (all 50 states + DC/territories,
// 100 senators + 435 House districts) is a real, separate, much larger
// data-entry task — not attempted in this pass. Every address CaseWhy
// resolves outside this pilot set correctly falls back to a "not covered
// yet" state pointing at the official House/Senate lookup tools instead
// of a wrong or fabricated entry.
export interface RepresentativeEntry {
  chamber: "senate" | "house";
  state: string; // USPS postal abbreviation
  /** House only — two-digit district number as Census returns it (e.g. "02"). */
  district?: string;
  name: string;
  party: string;
  website: string;
  /** DC office direct line if confirmed; the Capitol switchboard otherwise (always correct, just not direct). */
  phone: string;
  contactFormUrl?: string;
}

export const REPRESENTATIVES_AS_OF = "2026-09-06";

export const REPRESENTATIVES: RepresentativeEntry[] = [
  {
    chamber: "senate",
    state: "FL",
    name: "Ashley Moody",
    party: "R",
    website: "https://www.moody.senate.gov/",
    phone: "202-224-3041",
    contactFormUrl: "https://www.moody.senate.gov/contact-us/",
  },
  {
    chamber: "senate",
    state: "FL",
    name: "Rick Scott",
    party: "R",
    website: "https://www.rickscott.senate.gov",
    // Direct DC line not confirmed as of this writing — the Capitol
    // switchboard reaches any member's office and is always correct.
    phone: "202-224-3121",
    contactFormUrl: "https://www.rickscott.senate.gov/contact/contact",
  },
  {
    chamber: "house",
    state: "FL",
    district: "02",
    name: "Neal Dunn",
    party: "R",
    website: "https://dunn.house.gov",
    phone: "202-225-5235",
  },
];

export const OFFICIAL_HOUSE_LOOKUP_URL = "https://www.house.gov/representatives/find-your-representative";
export const OFFICIAL_SENATE_LOOKUP_URL = "https://www.senate.gov/senators/senators-contact.htm";

export function findRepresentatives(state: string, district: string): RepresentativeEntry[] {
  return REPRESENTATIVES.filter(
    (r) => r.state === state && (r.chamber === "senate" || r.district === district)
  );
}

/** True if this pilot dataset has any coverage at all for the given state (regardless of district). */
export function hasStateCoverage(state: string): boolean {
  return REPRESENTATIVES.some((r) => r.state === state);
}
