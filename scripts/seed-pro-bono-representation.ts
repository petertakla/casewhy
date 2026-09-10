// Round 58 — seeds the pro bono immigration-court representation directory
// (entity type 7) from EOIR's own quarterly "List of Pro Bono Legal Service
// Providers" PDF (justice.gov/eoir/file/probonofulllist/download,
// "Updated July 2026" per the document's own header). Parsed with a
// column-aware Python/pdfplumber script (not checked into this repo —
// throwaway, per this project's usual PDF-pipeline pattern) since the
// source is a genuinely two-column, gap-flowing layout where naive text
// extraction interleaves adjacent organizations. Verified against several
// of the source's own sample entries during parsing — see CLOUD_CLAUDE.md
// "Round 58" for the real coverage/quality numbers found.
//
// Usage:
//   npx tsx scripts/seed-pro-bono-representation.ts scripts/data/pro-bono-representation-2026-09-10.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { proBonoRepresentationDirectory } from "../src/lib/db/schema";

const SOURCE_CITATION =
  "Sourced from EOIR's List of Pro Bono Legal Service Providers (justice.gov/eoir/list-pro-bono-legal-service-providers), updated July 2026.";

interface SeedRecord {
  organizationName: string;
  isReferralService: boolean;
  streetAddress: string | null;
  cityStateZip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string | null;
  caseTypeLimits: string | null;
  intakePolicy: string | null;
  state: string;
  immigrationCourt: string;
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
    console.error("Usage: npx tsx scripts/seed-pro-bono-representation.ts <path-to-seed-json>");
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  await db.delete(proBonoRepresentationDirectory);

  const usedSlugs = new Set<string>();

  for (const r of records) {
    let slug = slugify(`${r.organizationName}-${r.immigrationCourt}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(proBonoRepresentationDirectory).values({
      slug,
      organizationName: r.organizationName,
      streetAddress: r.streetAddress,
      cityStateZip: r.cityStateZip,
      state: r.state,
      immigrationCourt: r.immigrationCourt,
      phone: r.phone,
      email: r.email,
      website: r.website,
      languages: r.languages,
      caseTypeLimits: r.caseTypeLimits,
      intakePolicy: r.intakePolicy,
      isReferralService: r.isReferralService,
      sourceCitation: SOURCE_CITATION,
    });
  }

  console.log(`Seeded ${records.length} pro bono immigration-court representation directory entries (nationwide).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
