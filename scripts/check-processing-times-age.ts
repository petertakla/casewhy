// Round 106 — prints every PROCESSING_TIMES entry whose asOf is older than
// 35 days. A warning, not a failure (per the task doc's explicit
// instruction) -- stale processing-time figures are a real editorial gap
// worth noticing, not a build-breaking bug the way a JSON-LD parse error
// or a missing language switcher is. Always exits 0, so this never blocks
// CI; its only job is making the age show up in every build log. The
// page's own staleness banner (45 days, src/lib/kb/processing-times.ts's
// hasStaleEntry()) is the reader-facing version of the same check, at a
// slightly longer threshold so this script gives 10 days of advance
// warning before a real visitor would ever see the banner.

import { PROCESSING_TIMES, daysSince } from "../src/lib/kb/processing-times";

const WARN_AFTER_DAYS = 35;

const stale = PROCESSING_TIMES.filter((e) => daysSince(e.asOf) > WARN_AFTER_DAYS);

if (stale.length > 0) {
  console.warn(`\n⚠ ${stale.length} processing-time entr${stale.length === 1 ? "y is" : "ies are"} more than ${WARN_AFTER_DAYS} days old:`);
  for (const entry of stale) {
    console.warn(`  - ${entry.id} (${entry.formType} — ${entry.categoryLabel}): asOf ${entry.asOf}, ${daysSince(entry.asOf)} days ago`);
  }
  console.warn("Re-drive egov.uscis.gov/processing-times in a real browser and update these entries.\n");
} else {
  console.log(`All ${PROCESSING_TIMES.length} processing-time entries are within ${WARN_AFTER_DAYS} days old.`);
}
