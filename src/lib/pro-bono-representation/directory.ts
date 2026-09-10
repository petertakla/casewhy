// Round 58 — pro bono immigration-court representation, entity type 7 of
// the (now seven-entity) "Get Help" system. Mirrors
// src/lib/community-orgs/directory.ts's shape: DB-backed, machine-seeded
// (see scripts/seed-pro-bono-representation.ts) from EOIR's own quarterly
// list.

import { getDb } from "@/lib/db/client";
import { proBonoRepresentationDirectory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface ProBonoRepresentationEntry {
  id: string;
  slug: string;
  organizationName: string;
  streetAddress: string | null;
  cityStateZip: string | null;
  state: string;
  immigrationCourt: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string | null;
  caseTypeLimits: string | null;
  intakePolicy: string | null;
  isReferralService: boolean;
  sourceCitation: string;
}

export async function getProBonoRepresentationDirectory(): Promise<ProBonoRepresentationEntry[]> {
  const db = getDb();
  return db
    .select()
    .from(proBonoRepresentationDirectory)
    .orderBy(asc(proBonoRepresentationDirectory.organizationName));
}

export async function getProBonoRepresentationBySlug(slug: string): Promise<ProBonoRepresentationEntry | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(proBonoRepresentationDirectory)
    .where(eq(proBonoRepresentationDirectory.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

// EOIR's own non-endorsement language, quoted verbatim per the task's
// explicit instruction — not paraphrased, and a meaningfully weaker
// guarantee than legalAidDirectory's DOJ-recognition vetting, which is
// exactly why this is its own entity type rather than merged rows there.
export const PRO_BONO_REPRESENTATION_DISCLAIMER =
  "EOIR does not endorse any of these organizations, referral services, or attorneys. Publication of this list does not constitute an endorsement by EOIR, and omission does not constitute a disapproval. EOIR does not participate in, nor is it responsible for, the representation decisions or performance of counsel on this list.";
