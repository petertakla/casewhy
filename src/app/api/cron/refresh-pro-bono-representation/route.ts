// Round 122 follow-up — monthly-automation treatment (same shape as the
// other three refresh routes) for the pro bono immigration-court
// representation directory. Full delete-and-reseed: this table has its
// own self-enroll gate (round 59) but no insert path other than
// scripts/seed-pro-bono-representation.ts confirmed in the schema/route
// code, matching the same "sole writer" safety profile as the other three.
//
// Anomaly guard: EOIR's list has no self-declared total to check against
// (unlike DOJ's roster or DSO's search tool) -- compares the fresh count
// against the currently-live count, same "under 70% of current" floor as
// the community-org refresh, since this source also has real quarter-to-
// quarter organization turnover.

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { proBonoRepresentationDirectory } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { slugify } from "@/lib/search/slugify";
import { fetchAndParseProBono } from "@/lib/directories/pro-bono/parse-pdf";

export const maxDuration = 300;

const ANOMALY_COVERAGE_FLOOR = 0.7;
const SOURCE_CITATION =
  "Sourced from EOIR's List of Pro Bono Legal Service Providers (justice.gov/eoir/list-pro-bono-legal-service-providers).";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    result = await fetchAndParseProBono();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createOpsTaskIfNotOpen({
      type: "pro-bono-fetch-error",
      title: "Pro bono representation refresh: EOIR PDF fetch/parse failed",
      description: message,
    });
    return Response.json({ error: "fetch failed", message }, { status: 502 });
  }

  const db = getDb();
  const before = await db.select({ count: sql<number>`count(*)::int` }).from(proBonoRepresentationDirectory);
  const beforeCount = before[0]?.count ?? 0;

  if (beforeCount > 0 && result.entries.length < beforeCount * ANOMALY_COVERAGE_FLOOR) {
    await createOpsTaskIfNotOpen({
      type: "pro-bono-anomaly",
      title: "Pro bono representation refresh skipped: anomalous count drop",
      description: `Fresh parse returned ${result.entries.length} entries vs ${beforeCount} currently live -- below the ${Math.round(
        ANOMALY_COVERAGE_FLOOR * 100
      )}% floor. Reseed skipped rather than risk wiping good data.`,
    });
    return Response.json({ skipped: true, beforeCount, freshCount: result.entries.length });
  }

  await db.delete(proBonoRepresentationDirectory);

  const usedSlugs = new Set<string>();
  for (const e of result.entries) {
    let slug = slugify(`${e.organizationName}-${e.immigrationCourt}`);
    let suffix = 2;
    const base = slug;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    await db.insert(proBonoRepresentationDirectory).values({
      slug,
      organizationName: e.organizationName,
      streetAddress: e.streetAddress,
      cityStateZip: e.cityStateZip,
      state: e.state,
      immigrationCourt: e.immigrationCourt,
      phone: e.phone,
      email: e.email,
      website: e.website,
      languages: e.languages,
      caseTypeLimits: e.caseTypeLimits,
      intakePolicy: e.intakePolicy,
      isReferralService: e.isReferralService,
      sourceCitation: SOURCE_CITATION,
    });
  }

  return Response.json({ before: beforeCount, after: result.entries.length, totalPages: result.totalPages });
}
