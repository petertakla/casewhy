// Round 40 — seeds the attorney directory (converted from a static,
// deliberately-empty array to a real DB table, see src/lib/db/schema.ts's
// attorneyDirectory) from official state-bar board-certification records.
//
// There is no attorney equivalent of the DOJ EOIR roster used for
// accredited representatives/legal aid orgs — any attorney licensed and in
// good standing in any state is automatically authorized before immigration
// court, with no resulting public federal roster. The closest analog: a
// handful of states run a formal "board certified specialist in immigration
// law" program administered directly by the state bar itself (a
// state-created regulatory body, not a private company) — Florida, Texas,
// and North Carolina are the only three found in research (see
// attorney-directory-self-sourcing-research-sep9.md). "Board-certified" is
// the vetting mechanism, same reasoning that already let accredited
// representatives and legal aid orgs be machine-seeded.
//
// Deliberately NOT sourced from AILA's directory, Avvo, Martindale-Hubbell,
// FindLaw, or Justia — those are private companies' proprietary directory
// products, a meaningfully different and riskier act to scrape and
// republish than an official state bar's own certification records.
//
// Per-state notes on how this data was actually pulled (no state exposed a
// clean bulk-download):
// - Florida (floridabar.org): a real paginated HTML directory, extracted
//   via a live browser session reading each result card's line-by-line
//   text (not collapsed whitespace — an early attempt that collapsed
//   line breaks silently merged street addresses into city names with no
//   delimiter; fixed by preserving each field on its own line before
//   parsing). 74 results, matching the page's own displayed count exactly.
// - Texas (tbls.org): a real, clean JSON REST API
//   (POST /api/repo/findlawyer, GET /api/repo/findlawyerbubbledata/{id}),
//   found by watching real network requests while using the site's own
//   search UI. 160 results — the site's own aggregate "areas" endpoint
//   separately reports 150 for this specialty, a real discrepancy between
//   two of TBLS's own endpoints (not a parsing bug on this end); the live
//   search result (also what a real visitor sees) was treated as the
//   authoritative count. Texas obfuscates email addresses in this API
//   (a reversible-looking but undecoded token) — deliberately left as
//   email: null rather than attempting to decode an anti-scraping
//   protection. 126 of 160 include a real website field directly from the
//   source (the one state of the three that publishes one).
// - North Carolina (portal.ncbar.gov): an ASP.NET member-directory search,
//   no JSON API — each of the 41 board-certified-immigration results
//   fetched individually by real page navigation. 2 excluded despite an
//   "Active"/eligible-to-practice status: each had a real, visible
//   disciplinary case on record (a Reprimand and a Censure respectively) —
//   round 27's own original vetting requirement ("listing a sanctioned
//   attorney would be a real trust problem") is honored here by excluding
//   rather than silently including just because the source's own bare
//   status flag still said "Active." 1 more excluded after repeated,
//   persistent site errors fetching that one specific record (Bar #51673)
//   — not fabricated around, just left out and disclosed. 38 of the
//   original 41 seeded.
//
// Only Florida and Texas expose a bar number cleanly as a distinct field;
// North Carolina's "Bar #" in the search results is used the same way.
// state = the certifying state (what "board certified by X" means), not
// necessarily the attorney's physical office location — a few entries
// have an out-of-state office address under a certification from one of
// these three states, and that's expected, not a data error.
//
// Usage:
//   npx tsx scripts/seed-attorneys.ts scripts/data/attorneys-nationwide-2026-09-09.json

import { readFileSync } from "fs";
import { getDb } from "../src/lib/db/client";
import { attorneyDirectory } from "../src/lib/db/schema";

interface SeedRecord {
  name: string;
  firm: string | null;
  state: string;
  bar_number: string | null;
  practice_focus: string;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  street_address: string | null;
  city_state_zip: string | null;
  source_citation: string;
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
    console.error("Usage: npx tsx scripts/seed-attorneys.ts <path-to-seed-json>");
    process.exit(1);
  }

  const records: SeedRecord[] = JSON.parse(readFileSync(filePath, "utf-8"));
  const db = getDb();

  // This script owns the machine-seeded rows in this table. Self-enrolled
  // approvals (round 27/28's original path, unchanged) would be added
  // separately by hand and aren't touched by this delete — but since no
  // self-enrolled attorney has been manually approved into this table yet
  // (the directory shipped empty until this round), a full delete-and-
  // reseed is safe today. Revisit this if/when a hand-approved entry
  // exists alongside machine-seeded ones.
  await db.delete(attorneyDirectory);

  const usedSlugs = new Set<string>();

  for (const r of records) {
    let slug = slugify(`${r.name}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(attorneyDirectory).values({
      slug,
      name: r.name,
      firm: r.firm,
      statesLicensed: r.state,
      barNumber: r.bar_number,
      practiceFocus: r.practice_focus,
      websiteUrl: r.website_url,
      phone: r.phone,
      email: r.email,
      streetAddress: r.street_address,
      cityStateZip: r.city_state_zip,
      sourceCitation: r.source_citation,
    });
  }

  console.log(`Seeded ${records.length} attorneys (FL/TX/NC board-certified).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
