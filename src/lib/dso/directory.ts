// Round 43 — university international student offices (DSOs), entity type
// 4 of the six-entity "Get Help" system. Mirrors src/lib/legal-aid/
// directory.ts's shape: DB-backed, machine-seeded (see
// scripts/seed-dso-directory.ts), SEVP certification is the vetting
// mechanism. Unlike the other entity types, this ships as a verified
// school directory that links out rather than a contact directory — DHS's
// own data has no DSO name/phone/email field anywhere (see the schema
// comment on dsoDirectory for why), so websiteUrl stays null from the seed
// and is only ever populated via an approved dsoApplications submission.

import { getDb } from "@/lib/db/client";
import { dsoDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface DsoEntry {
  id: string;
  slug: string;
  schoolName: string;
  campusName: string | null;
  isMainCampus: boolean;
  f1Certified: boolean;
  m1Certified: boolean;
  streetAddress: string | null;
  cityStateZip: string | null;
  state: string;
  phone: string | null;
  websiteUrl: string | null;
  dataSource: string;
  sourceCitation: string;
}

export async function getDsoDirectory(): Promise<DsoEntry[]> {
  const db = getDb();
  return db.select().from(dsoDirectory).orderBy(asc(dsoDirectory.schoolName));
}

export async function getDsoBySlug(slug: string): Promise<DsoEntry | null> {
  const db = getDb();
  const rows = await db.select().from(dsoDirectory).where(eq(dsoDirectory.slug, slug)).limit(1);
  return rows[0] ?? null;
}

// Same standard wording as every other entity type (round 39). Do not
// paraphrase this sentence.
export const DSO_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm current details directly with the school before relying on anyone.";
