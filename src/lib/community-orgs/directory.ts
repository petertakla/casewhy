// Round 43 — community and cultural organizations, entity type 5 of the
// six-entity "Get Help" system. Mirrors src/lib/legal-aid/directory.ts's
// shape: DB-backed, machine-seeded (see scripts/seed-community-orgs.ts),
// a real federal grant award (USCIS's Citizenship and Integration Grant
// Program) is the vetting mechanism. Explicitly partial coverage — grant
// winners only, not all community/cultural organizations — stated on every
// row via sourceCitation, same honesty standard as attorneys' 3-state
// board-certification list.

import { getDb } from "@/lib/db/client";
import { communityOrgDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface CommunityOrgEntry {
  id: string;
  slug: string;
  organizationName: string;
  cityStateZip: string | null;
  state: string;
  description: string | null;
  fiscalYearsAwarded: string;
  websiteUrl: string | null;
  dataSource: string;
  sourceCitation: string;
}

export async function getCommunityOrgDirectory(): Promise<CommunityOrgEntry[]> {
  const db = getDb();
  return db.select().from(communityOrgDirectory).orderBy(asc(communityOrgDirectory.organizationName));
}

export async function getCommunityOrgBySlug(slug: string): Promise<CommunityOrgEntry | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityOrgDirectory)
    .where(eq(communityOrgDirectory.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

// Same standard wording as every other entity type (round 39). Do not
// paraphrase this sentence.
export const COMMUNITY_ORG_DIRECTORY_DISCLAIMER =
  "This directory is for informational purposes only. It does not constitute a referral service, and listing does not imply an endorsement or recommendation by this platform. Always confirm current details directly with the organization before relying on anyone.";
