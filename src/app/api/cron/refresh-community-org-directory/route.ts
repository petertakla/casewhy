// Round 122 follow-up — monthly-automation treatment (same shape as
// refresh-doj-directories and refresh-attorney-directory) for the
// community/cultural org directory. Full delete-and-reseed: confirmed no
// code path inserts a self-enrolled row into communityOrgDirectory yet
// (scripts/seed-community-orgs.ts is the table's only writer), so there's
// nothing else to accidentally wipe -- same safety profile the DOJ refresh
// already has for legalAidDirectory/accreditedRepresentativeDirectory.
//
// Anomaly guard: compares the fresh merged total against the currently-live
// row count -- skip the reseed and file an ops_task if the fresh count is
// under 70% of what's currently live (a bit looser than the DOJ roster's
// 80% floor, since this source merges 5 independent fiscal-year fetches
// rather than one PDF with its own declared total, so more natural
// run-to-run variance is expected here).

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { communityOrgDirectory } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { slugify } from "@/lib/search/slugify";
import { fetchAndParseCigp } from "@/lib/directories/cigp";

export const maxDuration = 300;

const ANOMALY_COVERAGE_FLOOR = 0.7;

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    result = await fetchAndParseCigp();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createOpsTaskIfNotOpen({
      type: "cigp-fetch-error",
      title: "Community-org directory refresh: CIGP fetch/parse failed",
      description: message,
    });
    return Response.json({ error: "fetch failed", message }, { status: 502 });
  }

  const db = getDb();
  const before = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityOrgDirectory);
  const beforeCount = before[0]?.count ?? 0;

  if (beforeCount > 0 && result.records.length < beforeCount * ANOMALY_COVERAGE_FLOOR) {
    await createOpsTaskIfNotOpen({
      type: "cigp-anomaly",
      title: "Community-org directory refresh skipped: anomalous count drop",
      description: `Fresh parse returned ${result.records.length} records vs ${beforeCount} currently live (per-year: ${JSON.stringify(
        result.perYearCounts
      )}) -- below the ${Math.round(ANOMALY_COVERAGE_FLOOR * 100)}% floor. Reseed skipped rather than risk wiping good data.`,
    });
    return Response.json({ skipped: true, beforeCount, freshCount: result.records.length, perYearCounts: result.perYearCounts });
  }

  await db.delete(communityOrgDirectory);

  const usedSlugs = new Set<string>();
  for (const r of result.records) {
    let slug = slugify(`${r.organizationName}-${r.state}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(communityOrgDirectory).values({
      slug,
      organizationName: r.organizationName,
      cityStateZip: r.cityStateZip,
      state: r.state,
      description: r.description,
      fiscalYearsAwarded: r.fiscalYearsAwarded,
      dataSource: "uscis_cigp",
      sourceCitation: r.sourceCitation,
    });
  }

  return Response.json({
    before: beforeCount,
    after: result.records.length,
    perYearCounts: result.perYearCounts,
  });
}
