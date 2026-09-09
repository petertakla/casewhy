// Round 29 — BIA-accredited representatives directory, its own fully
// separate system from src/lib/attorneys/directory.ts per Peter's explicit
// call. See partner-marketing-domain-concept.md and CLOUD_CLAUDE.md round 29.
//
// An "accredited representative" is a non-lawyer authorized by the DOJ's
// Executive Office for Immigration Review (EOIR) Recognition & Accreditation
// Program to practice immigration law, typically while working at a
// recognized nonprofit organization. Their credential is DOJ accreditation
// (full or DHS-only), not a state bar number.
//
// Unlike the attorney directory (a hand-edited static array, since it ships
// empty pending real self-enrolled attorneys), this one is DB-backed and
// machine-seeded from DOJ's own public roster — being listed on DOJ's
// roster *is* the vetting here, unlike attorneys where CaseWhy needs its
// own bar-lookup confirmation and the attorney's own consent to be listed.
// See scripts/seed-accredited-representatives.ts for the seed process, and
// its own header comment for why this needed real PDF-table parsing rather
// than a summarized fetch (DOJ's roster isn't organized by state in its
// alphabetical-by-org form, and a quick fetch-and-summarize pass produced
// stale/truncated results when tried).

import { getDb } from "@/lib/db/client";
import { accreditedRepresentativeDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface AccreditedRepresentativeEntry {
  id: string;
  slug: string;
  representativeName: string;
  dhsOnly: boolean;
  accreditationExpiration: string | null;
  accreditationPendingRenewal: boolean;
  organizationName: string;
  organizationStatus: string;
  organizationRecognitionExpiration: string | null;
  organizationRecognitionPendingRenewal: boolean;
  officeType: string | null;
  streetAddress: string | null;
  cityStateZip: string | null;
  phone: string | null;
  state: string;
  sourceCitation: string;
}

export async function getAccreditedRepresentativeDirectory(): Promise<AccreditedRepresentativeEntry[]> {
  const db = getDb();
  return db
    .select()
    .from(accreditedRepresentativeDirectory)
    .orderBy(asc(accreditedRepresentativeDirectory.organizationName), asc(accreditedRepresentativeDirectory.representativeName));
}

export async function getAccreditedRepresentativeBySlug(
  slug: string
): Promise<AccreditedRepresentativeEntry | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(accreditedRepresentativeDirectory)
    .where(eq(accreditedRepresentativeDirectory.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

// Round 39 — adapted wording per Peter's direct instruction, same standard
// applied across all six entity types. Do not paraphrase this sentence.
export const ACCREDITED_REPRESENTATIVE_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm a representative's current DOJ accreditation yourself before relying on anyone.";
