// Round 59 — loads the cached disciplined-practitioners list and runs the
// screening check, shared by all three self-enroll apply.ts files plus
// scripts/screen-existing-listings.ts.

import { getDb } from "@/lib/db/client";
import { disciplinedPractitioners } from "@/lib/db/schema";
import { findDisciplineMatches, formatMatchSummary, type DisciplineRecord } from "./match";

export async function loadDisciplineRecords(): Promise<DisciplineRecord[]> {
  const db = getDb();
  const rows = await db.select().from(disciplinedPractitioners);
  return rows;
}

/** Returns a short summary string for the match(es) found, or null if none. */
export async function screenForDiscipline(name: string, statesText: string): Promise<string | null> {
  const records = await loadDisciplineRecords();
  const matches = findDisciplineMatches(name, statesText, records);
  if (matches.length === 0) return null;
  return formatMatchSummary(matches);
}
