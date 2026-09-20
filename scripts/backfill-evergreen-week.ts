// Round 116 — one-off backfill: queues the evergreen weekday fallback for
// a whole week of explicit dates ahead of time, so Peter can review the
// entire week in one Sunday-evening sitting instead of it trickling in
// day by day from the cron. Real production code path (ensureEvergreenForDate),
// not a synthetic/test version -- reusable for any future week by editing
// the DATES array below.
//
// Usage:
//   npx tsx scripts/backfill-evergreen-week.ts

import { getDb } from "../src/lib/db/client";
import { ensureEvergreenForDate } from "../src/lib/marketing/evergreen/generate-weekday-evergreen";

const DATES = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25"];

async function main() {
  const db = getDb();
  for (const iso of DATES) {
    const date = new Date(`${iso}T12:00:00Z`);
    const result = await ensureEvergreenForDate(db, date);
    console.log(iso, JSON.stringify(result));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
