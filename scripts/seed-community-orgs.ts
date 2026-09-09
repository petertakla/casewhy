// Round 43 — seeds the community/cultural organization directory from
// USCIS's own Citizenship and Integration Grant Program (CIGP) recipient
// records, FY2022-FY2024. A real federal grant award is the vetting
// mechanism, same category of official record as every other entity
// type's source. Explicitly partial coverage — grant winners only, not
// all community/cultural organizations serving immigrants — stated
// plainly in the source citation on every row.
//
// Direct fetch of the recipient PDFs worked cleanly (200, no bot-blocking)
// in this session — the 403 the Sep 9 research pass hit didn't reproduce;
// noted as a real discrepancy, not silently assumed fixed. Parsed with
// pdfplumber (same approach as the DOJ roster pipeline): org name, award
// amount, and a narrative description exist; no street address or contact
// field exists anywhere in the source (confirmed by actually reading a
// parsed PDF, not assumed) — this ships as the same "link out, don't
// fabricate contact info" shape as the DSO directory. Deduped across the
// three fiscal years by (organization name, state); an organization that
// won the grant in multiple years shows all years awarded, using the most
// recent year's description.
//
// One real parsing bug found and fixed: 3 of 173 raw records used a full
// state name ("Texas") or "Washington, D.C." instead of a 2-letter code —
// caught by cross-checking the regex match count (61 of 64 expected for
// FY23) against the PDF's own raw "Location:" occurrence count, not
// assumed complete. Fixed with an explicit state-name map plus a D.C.
// special case, re-verified to match exactly (43/64/66 for FY24/23/22).
//
// Usage:
//   npx tsx scripts/seed-community-orgs.ts scripts/data/community-orgs-2026-09-09.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { communityOrgDirectory } from "../src/lib/db/schema";

const SOURCE_CITATION =
  "Sourced from USCIS's Citizenship and Integration Grant Program recipient records, FY2022-FY2024, pulled 09/09/26. This list reflects organizations that received this specific federal grant, not all community organizations.";

interface SeedRecord {
  organization_name: string;
  city_state_zip: string;
  state: string;
  description: string;
  fiscal_years_awarded: string;
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
    console.error("Usage: npx tsx scripts/seed-community-orgs.ts <path-to-seed-json>");
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  await db.delete(communityOrgDirectory);

  const usedSlugs = new Set<string>();

  for (const r of records) {
    let slug = slugify(`${r.organization_name}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(communityOrgDirectory).values({
      slug,
      organizationName: r.organization_name,
      cityStateZip: r.city_state_zip,
      state: r.state,
      description: r.description,
      fiscalYearsAwarded: r.fiscal_years_awarded,
      dataSource: "uscis_cigp",
      sourceCitation: SOURCE_CITATION,
    });
  }

  console.log(`Seeded ${records.length} community/cultural organization directory entries (nationwide).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
