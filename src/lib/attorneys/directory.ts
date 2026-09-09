// Round 27, Phase 1 — began as a hand-curated, unpaid, editorial directory
// (a static, deliberately-empty array). Round 40 converts this to a real DB
// table, machine-seeded from official state-bar board-certification records
// (Florida, Texas, North Carolina — see scripts/seed-attorneys.ts) — the
// same reasoning that already let accredited representatives and legal aid
// orgs be machine-seeded rather than hand-curated: board certification by a
// state-created regulatory body is the vetting mechanism, not something
// Claude Code has to independently confirm. Self-enrollment
// (/attorneys/join, attorneyApplications) remains the path for every
// attorney outside these three states' certified lists, and for any
// board-certified attorney who'd rather list a different contact method
// than what the state bar publishes.
//
// Still Phase 1 only in the ways that matter for round 27's original legal
// reasoning: nobody pays to be listed, no per-referral fee, no endorsement
// implied — round 39's disclaimer wording says so explicitly on the page.

import { getDb } from "@/lib/db/client";
import { attorneyDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface AttorneyEntry {
  id: string;
  slug: string;
  name: string;
  firm: string | null;
  /** State postal codes, e.g. ["FL"]. Parsed from the comma-joined DB column. */
  statesLicensed: string[];
  /** Free text, comma-joined in the DB — e.g. "Board Certified - Immigration and Nationality Law". */
  practiceFocus: string[];
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  streetAddress: string | null;
  cityStateZip: string | null;
  sourceCitation: string | null;
}

function toEntry(row: typeof attorneyDirectory.$inferSelect): AttorneyEntry {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    firm: row.firm,
    statesLicensed: row.statesLicensed.split(",").map((s) => s.trim()).filter(Boolean),
    practiceFocus: row.practiceFocus.split(",").map((s) => s.trim()).filter(Boolean),
    websiteUrl: row.websiteUrl,
    phone: row.phone,
    email: row.email,
    streetAddress: row.streetAddress,
    cityStateZip: row.cityStateZip,
    sourceCitation: row.sourceCitation,
  };
}

export async function getAttorneyDirectory(): Promise<AttorneyEntry[]> {
  const db = getDb();
  const rows = await db.select().from(attorneyDirectory).orderBy(asc(attorneyDirectory.name));
  return rows.map(toEntry);
}

export async function getAttorneyBySlug(slug: string): Promise<AttorneyEntry | null> {
  const db = getDb();
  const rows = await db.select().from(attorneyDirectory).where(eq(attorneyDirectory.slug, slug)).limit(1);
  return rows[0] ? toEntry(rows[0]) : null;
}

// Round 39 — exact wording, per Peter's direct instruction: a real
// mitigation against the open Florida Bar Rule 4-7.22 "qualifying provider"
// question in attorney-referral-directory-concept.md, not just phrasing
// preference. Do not paraphrase this sentence.
export const ATTORNEY_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a lawyer referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm an attorney's current bar standing yourself before hiring anyone.";
