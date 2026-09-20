// Round 122 follow-up — monthly-automation treatment (same shape as
// refresh-doj-directories / refresh-attorney-directory / refresh-community-
// org-directory) for the DSO/school directory. Full delete-and-reseed:
// dso_directory has no self-enrollment insert path in the app yet
// (scripts/seed-dso-directory.ts is the table's sole writer), so nothing
// else is at risk of being wiped.
//
// Batched inserts, same reasoning scripts/seed-dso-directory.ts's own
// comment already documented: one-row-at-a-time sequential inserts over a
// real network connection to Neon timed out well before finishing at this
// row count (~26 rows/sec observed) -- 500-row batches finish in seconds.
//
// Anomaly guard: DHS's own "results-total" figure is this source's real
// declared total (unlike CIGP, which has no single self-declared total to
// check against) -- skip the reseed and file an ops_task if the fetch
// recovers under 90% of that declared figure.

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dsoDirectory } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { slugify } from "@/lib/search/slugify";
import { fetchAllDsoSchools } from "@/lib/directories/dso-schools";

export const maxDuration = 300;

const ANOMALY_COVERAGE_FLOOR = 0.9;
const SOURCE_CITATION =
  "Sourced from DHS's Study in the States School Search (studyinthestates.dhs.gov), Higher Education-certified schools.";
const BATCH_SIZE = 500;

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    result = await fetchAllDsoSchools();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createOpsTaskIfNotOpen({
      type: "dso-fetch-error",
      title: "DSO directory refresh: Study in the States fetch/parse failed",
      description: message,
    });
    return Response.json({ error: "fetch failed", message }, { status: 502 });
  }

  if (result.declaredTotal > 0 && result.records.length < result.declaredTotal * ANOMALY_COVERAGE_FLOOR) {
    await createOpsTaskIfNotOpen({
      type: "dso-anomaly",
      title: "DSO directory refresh skipped: anomalous count drop",
      description: `Fetch recovered ${result.records.length} of a declared ${result.declaredTotal} schools -- below the ${Math.round(
        ANOMALY_COVERAGE_FLOOR * 100
      )}% floor. Reseed skipped rather than risk wiping good data.`,
    });
    return Response.json({ skipped: true, declaredTotal: result.declaredTotal, fetched: result.records.length });
  }

  const db = getDb();
  const before = await db.select({ count: sql<number>`count(*)::int` }).from(dsoDirectory);
  const beforeCount = before[0]?.count ?? 0;

  await db.delete(dsoDirectory);

  const usedSlugs = new Set<string>();
  const rows = result.records.map((r) => {
    let slug = slugify(`${r.schoolName}-${r.campusName ?? ""}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    return {
      slug,
      schoolName: r.schoolName,
      campusName: r.campusName,
      isMainCampus: r.isMainCampus,
      f1Certified: r.f1Certified,
      m1Certified: r.m1Certified,
      streetAddress: r.streetAddress,
      cityStateZip: r.cityStateZip,
      state: r.state,
      dataSource: "dhs_study_in_the_states",
      sourceCitation: SOURCE_CITATION,
    };
  });

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(dsoDirectory).values(rows.slice(i, i + BATCH_SIZE));
  }

  return Response.json({ before: beforeCount, after: rows.length, declaredTotal: result.declaredTotal });
}
