// Round 29, Part 2 (Florida-only) then Round 35 Part 2 (nationwide) — seeds
// the accredited-representatives directory from DOJ EOIR's own public
// roster. Real PDF-table parsing (pdfplumber, cross-referencing two official
// DOJ documents), not a summarized fetch — see round29-accredited-reps-
// build-and-seed-task.md / round35-nav-bug-and-nationwide-reps-task.md for
// why a quick fetch-and-summarize pass isn't reliable enough here (DOJ's
// org-alphabetical roster doesn't carry addresses, and its "by state" roster
// doesn't carry individual representatives — this data is the two joined by
// organization name, cross-checked by hand for every discrepancy the join
// couldn't resolve automatically, not trusted blindly).
//
// A rep is included if DOJ marks it Status: Active, even mid-renewal
// (indicated by a trailing "*" and shown as "pending renewal" on the site) —
// DOJ itself still treats a filed-but-not-yet-processed renewal as current,
// so excluding those would have dropped roughly half of otherwise-real,
// DOJ-active entries. Only entries with a lapsed date AND no renewal marker
// at all (DOJ hasn't received any renewal filing) are excluded as genuinely
// stale.
//
// Known limitation, found and partly corrected at nationwide scale: the raw
// PDF's table extraction occasionally merges an organization's own header
// row into the previous organization's block when there's no clear visual
// gap between them (most often when the boundary falls on a page break),
// silently misattributing that org's first representative. A mechanical
// check (does the *next* page start a genuinely new org, or just continue
// the same one) found and fixed 13 such cases nationwide, cross-validated
// against this project's own already-hand-verified Florida subset (98/98
// representatives now match, plus one entry corrected beyond what the
// original Florida-only pass had). This is a known, low-frequency PDF-
// parsing limitation, not something a full page-by-page audit was run
// against beyond the checks described above.
//
// This is a recurring task, not a one-time seed — DOJ refreshes its roster
// roughly weekly (same "needs periodic re-hand-refresh" pattern already
// established for the processing-time/visa-bulletin knowledge base, CW-34).
// Re-running this script does a full delete-and-reseed (see below) rather
// than a pure upsert, since the slug scheme includes state.
//
// Usage:
//   npx tsx scripts/seed-accredited-representatives.ts scripts/data/accredited-representatives-nationwide-2026-08-30.json

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
    console.error(
      "Usage: npx tsx scripts/seed-accredited-representatives.ts <path-to-seed-json>"
    );
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  // The slug scheme now includes state (nationwide scale can repeat an
  // org/representative name pattern across states) — old Florida-only rows
  // seeded under the previous scheme won't match the new slugs, so they'd
  // sit alongside the new rows as stale duplicates rather than being
  // upserted. Clear the table first; this script is the sole owner of this
  // data (nothing else writes to it), so a full replace on each run is safe.
  await db.delete(accreditedRepresentativeDirectory);

  let inserted = 0;
  const usedSlugs = new Set<string>();

  for (const r of records) {
    // state included in the slug base — nationwide scale means the same
    // org/representative name pattern can recur across different states.
    let slug = slugify(`${r.representative_name}-${r.organization_name}-${r.state}`);
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
      state: r.state,
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

  console.log(`Seeded ${records.length} accredited representatives (nationwide).`);
  console.log(`(upserts: ${inserted} rows written)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
