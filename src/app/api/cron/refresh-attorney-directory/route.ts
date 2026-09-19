// Round 117 monthly-automation follow-up — Peter's own explicit ask
// ("need to be running refreshes every month on all of these entries"),
// confirmed choice ("Port to TypeScript API routes") over introducing
// Python as a second production runtime. Same bearer-secured pattern as
// every other /api/cron/* route.
//
// Refreshes attorneyDirectory from the 4 official state-bar board-
// certification sources (TX/FL/NC/CA — see src/lib/directories/attorney-
// sources/), one state at a time, each independently: a fetch failure or
// suspicious count drop in one state doesn't touch the other three's rows.
// This is a real safety improvement over scripts/seed-attorneys.ts's own
// full-table delete-and-reseed (that script's own comment already flags
// the risk: "safe today [only because] no self-enrolled attorney has been
// manually approved into this table yet" — a monthly unattended job can't
// rely on that staying true forever, and scoping every delete to
// `statesLicensed = X` sidesteps the question entirely, since self-enroll
// approvals would need a 5th, non-machine-seeded state value to collide).
//
// Anomaly guard: if a state's fresh count is less than half of what's
// currently live (and there were more than 5 live rows to begin with),
// that state's reseed is skipped and an ops_task is filed instead of
// silently wiping good data because of what's more likely a source-side
// hiccup or a real structural change upstream than an actual 50%+ drop in
// board-certified attorneys.

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { attorneyDirectory } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { slugify } from "@/lib/search/slugify";
import { AttorneySourceRecord } from "@/lib/directories/attorney-sources/types";
import { fetchTexasAttorneys } from "@/lib/directories/attorney-sources/texas";
import { fetchFloridaAttorneys } from "@/lib/directories/attorney-sources/florida";
import { fetchNorthCarolinaAttorneys } from "@/lib/directories/attorney-sources/north-carolina";
import { fetchCaliforniaAttorneys } from "@/lib/directories/attorney-sources/california";

export const maxDuration = 300;

const SOURCES: { state: string; module: string; fetch: (pullDate: string) => Promise<AttorneySourceRecord[]> }[] = [
  { state: "TX", module: "texas", fetch: fetchTexasAttorneys },
  { state: "FL", module: "florida", fetch: fetchFloridaAttorneys },
  { state: "NC", module: "north-carolina", fetch: fetchNorthCarolinaAttorneys },
  { state: "CA", module: "california", fetch: fetchCaliforniaAttorneys },
];

const ANOMALY_DROP_FACTOR = 0.5;
const ANOMALY_MIN_PRIOR = 5;

interface StateResult {
  state: string;
  before: number;
  after: number;
  fetched: number;
  status: "reseeded" | "skipped-anomaly" | "error";
  message?: string;
}

async function reseedState(state: string, records: AttorneySourceRecord[]): Promise<void> {
  const db = getDb();
  await db.delete(attorneyDirectory).where(eq(attorneyDirectory.statesLicensed, state));

  const usedSlugs = new Set<string>();
  for (const r of records) {
    let slug = slugify(`${r.name}-${state}`);
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
      barNumber: r.barNumber,
      practiceFocus: r.practiceFocus,
      websiteUrl: r.websiteUrl,
      phone: r.phone,
      email: r.email,
      streetAddress: r.streetAddress,
      cityStateZip: r.cityStateZip,
      sourceCitation: r.sourceCitation,
    });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const pullDate = new Intl.DateTimeFormat("en-US", { year: "2-digit", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(new Date());

  const results: StateResult[] = [];

  for (const source of SOURCES) {
    const [{ count: before }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attorneyDirectory)
      .where(eq(attorneyDirectory.statesLicensed, source.state));

    try {
      const records = await source.fetch(pullDate);

      if (before > ANOMALY_MIN_PRIOR && records.length < before * ANOMALY_DROP_FACTOR) {
        await createOpsTaskIfNotOpen({
          type: `attorney-directory-anomaly-${source.state}`,
          title: `Attorney directory refresh: ${source.state} count dropped sharply`,
          description: `${source.state}'s live count was ${before}, but this month's automated re-pull only found ${records.length} (more than a 50% drop) — skipped the reseed rather than risk wiping good data on what's more likely a source-side change than a real drop in board-certified attorneys. Check src/lib/directories/attorney-sources/${source.module}.ts against the live site before re-running this route manually.`,
        });
        results.push({ state: source.state, before, after: before, fetched: records.length, status: "skipped-anomaly" });
        continue;
      }

      await reseedState(source.state, records);
      results.push({ state: source.state, before, after: records.length, fetched: records.length, status: "reseeded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await createOpsTaskIfNotOpen({
        type: `attorney-directory-error-${source.state}`,
        title: `Attorney directory refresh: ${source.state} fetch failed`,
        description: `This month's automated re-pull for ${source.state} threw: ${message}. That state's existing rows were left untouched. Check src/lib/directories/attorney-sources/ against the live site.`,
      });
      results.push({ state: source.state, before, after: before, fetched: 0, status: "error", message });
    }
  }

  return Response.json({ pullDate, results });
}
