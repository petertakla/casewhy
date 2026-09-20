// Round 117 monthly-automation follow-up — shared types for the DOJ EOIR
// roster parser (feeds accreditedRepresentativeDirectory and
// legalAidDirectory). See index.ts for why this is a position-based
// (x/y-coordinate) reconstruction rather than pdfplumber-style table
// detection -- it turned out more reliable, not just a TS-vs-Python swap.

export interface RepEntry {
  name: string;
  dhsOnly: boolean;
  expiration: string | null;
  pendingRenewal: boolean;
  status: string | null;
}

export interface OrgRepsRecord {
  name: string;
  recognized: string | null;
  expiration: string | null;
  status: string | null;
  reps: RepEntry[];
}

export interface OrgAddressRecord {
  name: string;
  officeType: string | null;
  streetAddress: string | null;
  cityStateZip: string | null;
  state: string | null;
  phone: string | null;
}

export function normalizeOrgName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Splits a value like "08/14/26* (Pending Renewal)" (already joined across
 * its wrapped lines) into a clean date and a pending-renewal flag -- DOJ's
 * own convention: a trailing "*" plus the "(Pending Renewal)" annotation
 * means a filed-but-not-yet-processed renewal, still counted current (see
 * scripts/seed-accredited-representatives.ts's own header comment on why
 * pending-renewal entries are included, not excluded). */
export function parseDateWithPending(joined: string | null): { value: string | null; pending: boolean } {
  if (!joined) return { value: null, pending: false };
  const pending = joined.includes("*") || /Pending Renewal/i.test(joined);
  const m = /^([\d/]+)\*?/.exec(joined);
  return { value: m ? m[1] : joined.replace(/\s*\(Pending Renewal\)\s*/i, "").trim(), pending };
}
