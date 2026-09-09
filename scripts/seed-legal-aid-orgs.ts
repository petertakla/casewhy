// Round 34 — seeds the legal-aid/nonprofit-organizations directory from the
// same DOJ EOIR roster used by scripts/seed-accredited-representatives.ts
// (round 29/32/35), pulling the *organization* rows this time rather than
// individual representatives. Uses the recognized-organizations side of the
// combined roster (not EOIR's separate pro-bono-providers list) so there's
// no "not for solicitation of paid legal services" restriction to navigate
// — DOJ recognition of the organization itself is the vetting mechanism.
//
// Built nationwide from the start (round 35's lesson, applied directly):
// round 29 shipped Florida-only and needed a whole separate round (32) to
// go nationwide later. This data file already covers every U.S. state that
// appears in DOJ's roster (49 + DC — no current entries for VT/WV, and no
// territories anywhere in this document, both confirmed directly against
// the PDF, not assumed).
//
// A handful of exclusions applied during parsing, same discipline as the
// accredited-representatives seed: 12 organizations have no address
// anywhere in the source document (excluded rather than shipped with a
// fabricated one) and 1 organization's recognition has genuinely lapsed
// (a past expiration date with no pending-renewal marker at all).
//
// orgType/contactPerson/populationServed/servicesOffered are always null
// from this seed — DOJ's roster has no such fields at all. They exist as
// nullable columns so a future manual-curation pass (or an approved
// self-enroll application via /legal-aid/join) can fill them in without a
// schema change, not because this seed fabricates them.
//
// Usage:
//   npx tsx scripts/seed-legal-aid-orgs.ts scripts/data/legal-aid-orgs-2026-08-30.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { legalAidDirectory } from "../src/lib/db/schema";

const SOURCE_CITATION =
  "Sourced from the DOJ EOIR Recognized Organizations and Accredited Representatives Roster, current as of 08/30/26 (Report Last Updated date printed on the roster itself).";

interface SeedRecord {
  organization_name: string;
  organization_status: string;
  organization_recognized_date: string | null;
  organization_recognition_expiration: string | null;
  organization_recognition_pending_renewal: boolean;
  office_type: string | null;
  street_address: string | null;
  city_state_zip: string | null;
  phone: string | null;
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
    console.error("Usage: npx tsx scripts/seed-legal-aid-orgs.ts <path-to-seed-json>");
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  // Full delete-and-reseed, same reasoning as the accredited-representatives
  // seed script: this script is the sole owner of this table's data, and a
  // full replace on each run is simpler and safer than trying to reconcile
  // stale rows against a re-pulled roster.
  await db.delete(legalAidDirectory);

  const usedSlugs = new Set<string>();

  for (const r of records) {
    // State included in the slug — the same org-name collision risk that
    // applies to accredited representatives applies here too, at the same
    // nationwide scale.
    let slug = slugify(`${r.organization_name}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(legalAidDirectory).values({
      slug,
      organizationName: r.organization_name,
      organizationStatus: r.organization_status,
      organizationRecognizedDate: r.organization_recognized_date,
      organizationRecognitionExpiration: r.organization_recognition_expiration,
      organizationRecognitionPendingRenewal: r.organization_recognition_pending_renewal,
      officeType: r.office_type,
      streetAddress: r.street_address,
      cityStateZip: r.city_state_zip,
      phone: r.phone,
      state: r.state,
      sourceCitation: SOURCE_CITATION,
    });
  }

  console.log(`Seeded ${records.length} legal aid organizations (nationwide).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
