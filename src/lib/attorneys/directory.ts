// Round 27, Phase 1 — a hand-curated, unpaid, editorial directory of
// immigration attorneys. Same "small, easy to edit" pattern as
// src/lib/news/sources.ts and src/lib/congress/representatives.ts.
//
// Deliberately Phase 1 only: nobody pays to be listed, no per-referral fee,
// no application/admin-approval flow. This is what keeps it outside the
// fee-splitting rules (ABA Model Rule 5.4(a)/7.2(b)) and — pending a real
// confirmation, not an assumption — likely outside Florida Bar Rule 4-7.22's
// "qualifying provider" regulation too, which targets for-profit referral
// arrangements. Phase 2 (flat-fee paid listings) is NOT authorized and
// stays gated on the attorney review already deferred from round 13 — see
// attorney-referral-directory-concept.md and CLOUD_CLAUDE.md round 27.
//
// Ships empty on purpose. Real attorneys are Peter's own business-
// development track (warm intro from his own N-400 attorney, AILA's
// Florida chapter, direct solo/small-firm outreach) — not something
// Claude Code sources. Adding a real entry is a one-line edit to the array
// below, no code change needed elsewhere.
//
// VETTING REQUIREMENT — non-negotiable, before adding any real entry:
// confirm active bar admission and good standing via that state's public
// attorney-lookup tool (e.g. The Florida Bar's own "Find a Lawyer" search
// for a Florida-licensed attorney). Listing a lapsed or sanctioned attorney
// would be a real trust problem, not just a data error.

export interface AttorneyEntry {
  id: string;
  name: string;
  firm: string;
  /** State postal codes, e.g. ["FL"]. An attorney can be licensed in more than one state. */
  statesLicensed: string[];
  /** e.g. "Asylum", "Family-based", "Employment-based", "Naturalization" — free text, not an enum, since coverage will grow with CaseWhy's own case-type list. */
  practiceFocus: string[];
  contactMethod: {
    label: string;
    url: string;
  };
}

export const ATTORNEY_DIRECTORY: AttorneyEntry[] = [];

// Round 39 — exact wording, per Peter's direct instruction: a real
// mitigation against the open Florida Bar Rule 4-7.22 "qualifying provider"
// question in attorney-referral-directory-concept.md, not just phrasing
// preference. Do not paraphrase this sentence.
export const ATTORNEY_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a lawyer referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm an attorney's current bar standing yourself before hiring anyone.";
