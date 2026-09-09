// Round 43 — seeds the DSO (university international student office)
// directory from DHS's own "Study in the States" School Search
// (studyinthestates.dhs.gov/school-search). SEVP certification is the
// vetting mechanism — a federally-certified school, same category of
// official record as every other entity type's source.
//
// Scoped to Education Type = Higher Education only (6,070 campuses), not
// all 13,839 SEVP-certified institutions nationwide (which also includes
// K-12 private schools, flight schools, and language institutes) — a
// deliberate, documented narrowing since "university international
// student offices" is this entity type's own stated framing.
//
// Real parsing issues found and fixed before trusting this data:
// (1) Akamai (the CDN in front of studyinthestates.dhs.gov) serves a stub
// page with no results to a bare curl User-Agent — a real browser UA
// header fixes it, no headless browser needed. (2) DHS's own source data
// has a literal double-comma typo on at least one row ("820 N. La Salle
// Blvd., Chicago,, IL 60610" for Moody Bible Institute, confirmed by
// re-fetching that exact row directly) — handled by dropping empty
// comma-separated segments rather than guessing the intended address.
// (3) ~262 records had HTML entities escaped twice (e.g. "&amp;amp;" for
// a literal "&") — both passes resolved via a double html.unescape().
// (4) 1 real duplicate row (ArtCenter College of Design's South Campus
// appeared 3x identically, likely multiple SEVP program certifications
// for the same campus) — deduped on (school, campus, address) before
// this final seed file.
//
// No websiteUrl populated from the source — DHS's data has no such field
// anywhere, confirmed by checking a school's own detail page directly, not
// assumed absent. Left null rather than guessed/constructed; dsoApplications
// (/dso/join) is the only path to a real one.
//
// Usage:
//   npx tsx scripts/seed-dso-directory.ts scripts/data/dso-directory-2026-09-09.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { dsoDirectory } from "../src/lib/db/schema";

const SOURCE_CITATION =
  "Sourced from DHS's Study in the States School Search (studyinthestates.dhs.gov), Higher Education-certified schools, pulled 09/09/26.";

interface SeedRecord {
  school_name: string;
  campus_name: string | null;
  is_main_campus: boolean;
  f1_certified: boolean;
  m1_certified: boolean;
  street_address: string | null;
  city_state_zip: string | null;
  state: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/seed-dso-directory.ts <path-to-seed-json>");
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  // Full delete-and-reseed, same reasoning as every other entity type's
  // seed script — this script is the sole owner of this table's data.
  await db.delete(dsoDirectory);

  const usedSlugs = new Set<string>();
  const rows = records.map((r) => {
    let slug = slugify(`${r.school_name}-${r.campus_name ?? ""}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    return {
      slug,
      schoolName: r.school_name,
      campusName: r.campus_name,
      isMainCampus: r.is_main_campus,
      f1Certified: r.f1_certified,
      m1Certified: r.m1_certified,
      streetAddress: r.street_address,
      cityStateZip: r.city_state_zip,
      state: r.state,
      dataSource: "dhs_study_in_the_states",
      sourceCitation: SOURCE_CITATION,
    };
  });

  // Batched, not one insert per row — at 6,068 rows, one-row-at-a-time
  // sequential inserts over a real network connection to Neon timed out
  // well before finishing (~26 rows/sec observed). 500-row batches finish
  // in seconds instead of minutes.
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(dsoDirectory).values(rows.slice(i, i + BATCH_SIZE));
  }

  console.log(`Seeded ${records.length} DSO/school directory entries (nationwide, Higher Education).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
