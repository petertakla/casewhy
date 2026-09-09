// Round 34 — legal aid / nonprofit immigration organizations directory,
// entity type 3 of the six-entity "Get Help" system. Mirrors
// src/lib/accredited-representatives/directory.ts's shape and reasoning:
// this is DB-backed and machine-seeded (see scripts/seed-legal-aid-orgs.ts)
// rather than hand-curated like the attorney directory, since DOJ
// recognition of the organization itself is the vetting mechanism — no
// consent gap or bar-lookup confirmation needed the way attorneys require.

import { getDb } from "@/lib/db/client";
import { legalAidDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface LegalAidEntry {
  id: string;
  slug: string;
  organizationName: string;
  orgType: string | null;
  contactPerson: string | null;
  populationServed: string | null;
  servicesOffered: string | null;
  organizationStatus: string;
  organizationRecognizedDate: string | null;
  organizationRecognitionExpiration: string | null;
  organizationRecognitionPendingRenewal: boolean;
  officeType: string | null;
  streetAddress: string | null;
  cityStateZip: string | null;
  phone: string | null;
  state: string;
  sourceCitation: string;
}

export async function getLegalAidDirectory(): Promise<LegalAidEntry[]> {
  const db = getDb();
  return db.select().from(legalAidDirectory).orderBy(asc(legalAidDirectory.organizationName));
}

export async function getLegalAidBySlug(slug: string): Promise<LegalAidEntry | null> {
  const db = getDb();
  const rows = await db.select().from(legalAidDirectory).where(eq(legalAidDirectory.slug, slug)).limit(1);
  return rows[0] ?? null;
}

// Round 39 — adapted wording per Peter's direct instruction, same standard
// applied across all six entity types. Do not paraphrase this sentence.
export const LEGAL_AID_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm current details (services, service area, contact info) directly with the organization before relying on anyone.";
