// Round 29 — a hand-curated, unpaid, editorial directory of BIA-accredited
// representatives, following the exact same pattern as
// src/lib/attorneys/directory.ts (round 27) but as its own fully separate
// system, per Peter's explicit call: attorneys and accredited
// representatives look similar on paper, but each entity type gets its own
// table/page/flow rather than one shared directory filtered by type. See
// partner-marketing-domain-concept.md and CLOUD_CLAUDE.md round 29.
//
// An "accredited representative" is a non-lawyer authorized by the DOJ's
// Executive Office for Immigration Review (EOIR) Recognition & Accreditation
// Program to practice immigration law, typically while working at a
// recognized nonprofit organization. Their credential is DOJ accreditation
// (full or partial), not a state bar number.
//
// Ships empty on purpose, same as the attorney directory. Real entries are
// Peter's own outreach track, not something Claude Code sources. Adding a
// real entry is a one-line edit to the array below, no code change needed
// elsewhere.
//
// VETTING REQUIREMENT — non-negotiable, before adding any real entry:
// confirm the representative's DOJ accreditation and their organization's
// DOJ recognition are both real and current via EOIR's own published roster
// (https://www.justice.gov/eoir/recognition-accreditation-roster-reports).
// Listing a lapsed or revoked accreditation would be a real trust problem,
// not just a data error — same standard as the attorney directory's bar-
// standing check.

export interface RepresentativeEntry {
  id: string;
  name: string;
  organization: string;
  /** e.g. "Full accreditation — Catholic Charities of Central Florida (DOJ-recognized)". Free text, in place of a bar number, since accreditation is per-organization and full/partial. */
  accreditationDetails: string;
  /** States/regions actually served, free text (e.g. ["FL"], or ["Nationwide (virtual)"]). */
  statesServed: string[];
  /** e.g. "Asylum", "DACA", "Naturalization" — free text, not an enum, mirroring the attorney directory's practiceFocus. */
  practiceFocus: string[];
  contactMethod: {
    label: string;
    url: string;
  };
}

export const REPRESENTATIVE_DIRECTORY: RepresentativeEntry[] = [];

export const REPRESENTATIVE_DIRECTORY_DISCLAIMER =
  "This is an informational list, not an endorsement or a referral service. CaseWhy does not vouch for outcomes, and being listed here doesn't mean a representative is right for your specific situation. Always confirm a representative's current DOJ accreditation yourself before relying on anyone.";
