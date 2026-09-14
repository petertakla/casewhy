// Round 86 — standalone runner for one USCIS sandbox volume-test run.
// Shares src/lib/uscis/sandbox-volume-test.ts with the deployed route
// (/api/cron/uscis-volume-test) -- see that file's comment for the
// confirmed-working-receipt-pool correction found this round. Runs
// directly against local USCIS sandbox credentials (.env.local), no
// deployed route or CRON_SECRET needed.
//
// Usage: node --env-file=.env.local ./node_modules/.bin/tsx scripts/uscis-volume-run.ts

import { runOneVolumeTestBatch } from "../src/lib/uscis/sandbox-volume-test";

async function main() {
  const result = await runOneVolumeTestBatch();
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...result }, null, 2));
}
main();
