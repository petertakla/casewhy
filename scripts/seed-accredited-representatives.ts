// Round 29, Part 2 — seeds the accredited-representatives directory from
// DOJ EOIR's own public roster. Real PDF-table parsing (pdfplumber, cross-
// referencing two official DOJ documents), not a summarized fetch — see the
// round29-accredited-reps-build-and-seed-task.md handoff for why a quick
// fetch-and-summarize pass isn't reliable enough here (DOJ's org-alphabetical
// roster doesn't carry addresses, and its "by state" roster doesn't carry
// individual representatives — this data is the two joined by organization
// name, cross-checked by hand for every discrepancy the join couldn't
// resolve automatically, not trusted blindly).
//
// A rep is included if DOJ marks it Status: Active, even mid-renewal
// (indicated by a trailing "*" and shown as "pending renewal" on the site) —
// DOJ itself still treats a filed-but-not-yet-processed renewal as current,
// so excluding those would have dropped roughly half of otherwise-real,
// DOJ-active entries. Only entries with a lapsed date AND no renewal marker
// at all (DOJ hasn't received any renewal filing) are excluded as genuinely
// stale.
//
// This is a recurring task, not a one-time seed — DOJ refreshes its roster
// roughly weekly (same "needs periodic re-hand-refresh" pattern already
// established for the processing-time/visa-bulletin knowledge base, CW-34).
// Re-running this script is safe: it upserts on the unique slug, so a
// re-pull with an updated data file just refreshes existing rows and adds
// new ones, it doesn't duplicate.
//
// Usage:
//   npx tsx scripts/seed-accredited-representatives.ts scripts/data/fl-accredited-representatives-2026-08-30.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { accreditedRepresentativeDirectory } from "../src/lib/db/schema";

const SOURCE_CITATION =
  "Sourced from the DOJ EOIR Recognized Organizations and Accredited Representatives Roster, current as of 08/30/26 (Report Last Updated date printed on the roster itself).";

interface SeedRecord {
  representative_name: string;
  representative_status_dhs_only: boolean;
  accreditation_expiration: string | null;
  accreditation_pending_renewal: boolean;
  organization_name: string;
  organization_status: string;
  organization_recognized_date: string | null;
  organization_recognition_expiration: string | null;
  organization_recognition_pending_renewal: boolean;
  office_type: string | null;
  street_address: string | null;
  city_state_zip: string | null;
  phone: string | null;
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
    console.error(
      "Usage: npx tsx scripts/seed-accredited-representatives.ts <path-to-seed-json>"
    );
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  let inserted = 0;
  let updated = 0;
  const usedSlugs = new Set<string>();

  for (const r of records) {
    let slug = slugify(`${r.representative_name}-${r.organization_name}`);
    // guard against two reps at the same org producing an identical slug
    // (e.g. two people with the same name) — append a numeric suffix
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    const values = {
      slug,
      representativeName: r.representative_name,
      dhsOnly: r.representative_status_dhs_only,
      accreditationExpiration: r.accreditation_expiration,
      accreditationPendingRenewal: r.accreditation_pending_renewal,
      organizationName: r.organization_name,
      organizationStatus: r.organization_status,
      organizationRecognitionExpiration: r.organization_recognition_expiration,
      organizationRecognitionPendingRenewal: r.organization_recognition_pending_renewal,
      officeType: r.office_type,
      streetAddress: r.street_address,
      cityStateZip: r.city_state_zip,
      phone: r.phone,
      state: "FL",
      sourceCitation: SOURCE_CITATION,
    };

    const result = await db
      .insert(accreditedRepresentativeDirectory)
      .values(values)
      .onConflictDoUpdate({
        target: accreditedRepresentativeDirectory.slug,
        set: values, // createdAt omitted on purpose — stays whatever it was on the first insert
      })
      .returning({ id: accreditedRepresentativeDirectory.id });

    if (result.length > 0) {
      inserted += 1;
    }
  }

  console.log(`Seeded ${records.length} accredited representatives (Florida).`);
  console.log(`(upserts: ${inserted} rows written)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
