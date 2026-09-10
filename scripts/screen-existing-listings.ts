// Round 59 — periodic re-check of everything already listed (attorney
// directory, accredited-representative directory) against EOIR's
// disciplined-practitioners list. Detection/reporting only — never
// auto-delists anyone, per the task's own explicit instruction. Meant to
// run monthly, separate from round 42's quarterly/annual directory-refresh
// cadence (attorney discipline is time-sensitive in a way stale contact
// info isn't) — this script itself doesn't schedule anything, see
// CLOUD_CLAUDE.md "Round 59" for the recommended cadence.
//
// The pro bono representation directory (round 58) is org-level, not
// individual practitioners, so it's out of scope here — there's no
// person's name to screen. (Its self-enroll join flow does screen the
// individual contactPerson field — see src/lib/pro-bono-representation/
// apply.ts.)
//
// Usage:
//   npx tsx scripts/screen-existing-listings.ts

import { getDb } from "../src/lib/db/client";
import { attorneyDirectory, accreditedRepresentativeDirectory } from "../src/lib/db/schema";
import { loadDisciplineRecords } from "../src/lib/discipline/screen";
import { findDisciplineMatches, formatMatchSummary } from "../src/lib/discipline/match";

async function main() {
  const db = getDb();
  const records = await loadDisciplineRecords();

  const attorneys = await db.select().from(attorneyDirectory);
  const reps = await db.select().from(accreditedRepresentativeDirectory);

  let totalMatches = 0;

  console.log(`Screening ${attorneys.length} attorneys against ${records.length} disciplined-practitioner records...`);
  for (const a of attorneys) {
    const matches = findDisciplineMatches(a.name, a.statesLicensed, records);
    if (matches.length > 0) {
      totalMatches++;
      console.log(`\n[ATTORNEY] ${a.name} (${a.statesLicensed}) — id ${a.id}`);
      console.log(formatMatchSummary(matches));
    }
  }

  console.log(
    `\nScreening ${reps.length} accredited representatives against ${records.length} disciplined-practitioner records...`
  );
  for (const r of reps) {
    const matches = findDisciplineMatches(r.representativeName, r.state, records);
    if (matches.length > 0) {
      totalMatches++;
      console.log(`\n[ACCREDITED REP] ${r.representativeName} (${r.state}) — id ${r.id}`);
      console.log(formatMatchSummary(matches));
    }
  }

  console.log(
    `\nDone. ${totalMatches} listing(s) out of ${attorneys.length + reps.length} had at least one match. No listings were changed — this is a report for manual review only.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
