// Round 117 monthly-automation follow-up, phase 2 — Peter's explicit call
// (asked directly whether to add a PDF library and port carefully vs.
// leave this manual vs. run Python as a second runtime; chose "add a PDF
// library, port carefully"). Refreshes accreditedRepresentativeDirectory
// and legalAidDirectory from DOJ EOIR's own roster PDF, both driven by the
// single parse in src/lib/directories/doj-eoir-roster/ (see that module's
// own header comments for the real parsing model and the bugs found while
// building it — a position-based reconstruction using unpdf, not a
// pdfplumber-style table-detection port).
//
// Same bearer-secured pattern as every other /api/cron/* route. Full
// delete-and-reseed on both tables per run, matching what
// scripts/seed-accredited-representatives.ts and scripts/seed-legal-aid-
// orgs.ts already do (both are this data's sole owner — nothing else
// writes to either table). Orgs whose address didn't match anything in
// the roster's own address appendix are excluded from BOTH tables, not
// just missing a field — `state` is NOT NULL on both, and there is no
// other source for it.
//
// Anomaly guard: since this is one PDF (not 4 independent per-state
// fetches like the attorney-directory refresh), the check is a single
// global one — if the parse's own joined-org count comes back under 80%
// of the roster's own declared "Number of Recognized Organizations"
// figure (printed on its cover page, so this isn't comparing against a
// stale number), something is probably broken in the parser rather than
// DOJ's roster actually shrinking that fast — skip the reseed and file an
// ops_task instead.

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { accreditedRepresentativeDirectory, legalAidDirectory } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createOpsTaskIfNotOpen } from "@/lib/ops/ops-tasks";
import { fetchAndParseDojEoirRoster } from "@/lib/directories/doj-eoir-roster";

export const maxDuration = 300;

const ANOMALY_COVERAGE_FLOOR = 0.8;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;
  try {
    result = await fetchAndParseDojEoirRoster();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createOpsTaskIfNotOpen({
      type: "doj-eoir-roster-fetch-error",
      title: "DOJ EOIR roster refresh: fetch/parse failed",
      description: `This month's automated re-pull threw: ${message}. Existing accreditedRepresentativeDirectory/legalAidDirectory rows were left untouched. Check src/lib/directories/doj-eoir-roster/ against the live PDF at https://www.justice.gov/eoir/page/file/942301/download.`,
    });
    return Response.json({ error: "fetch-or-parse-failed", message }, { status: 502 });
  }

  const withState = result.joined.filter((j) => j.address?.state);
  const excludedNoAddress = result.joined.length - withState.length;

  if (result.declaredOrgCount && result.joined.length < result.declaredOrgCount * ANOMALY_COVERAGE_FLOOR) {
    await createOpsTaskIfNotOpen({
      type: "doj-eoir-roster-anomaly",
      title: "DOJ EOIR roster refresh: parsed org count dropped sharply",
      description: `The roster's own cover page declares ${result.declaredOrgCount} Recognized Organizations, but this parse only found ${result.joined.length} orgs with at least one current rep (${(ANOMALY_COVERAGE_FLOOR * 100).toFixed(0)}% floor). Skipped the reseed rather than risk wiping good data — likely a parser break (the PDF's own layout may have changed), not real roster shrinkage. Check src/lib/directories/doj-eoir-roster/ against the live PDF before re-running this route manually.`,
    });
    return Response.json({
      status: "skipped-anomaly",
      declaredOrgCount: result.declaredOrgCount,
      parsedOrgCount: result.joined.length,
    });
  }

  const db = getDb();
  const sourceCitation = `Sourced from the DOJ EOIR Recognized Organizations and Accredited Representatives Roster, current as of ${result.reportDate ?? "unknown date"} (Report Last Updated date printed on the roster itself).`;

  const [{ count: repsBefore }] = await db.select({ count: sql<number>`count(*)::int` }).from(accreditedRepresentativeDirectory);
  const [{ count: orgsBefore }] = await db.select({ count: sql<number>`count(*)::int` }).from(legalAidDirectory);

  await db.delete(accreditedRepresentativeDirectory);
  await db.delete(legalAidDirectory);

  const usedRepSlugs = new Set<string>();
  const usedOrgSlugs = new Set<string>();
  let repsInserted = 0;

  for (const { reps: org, address } of withState) {
    const state = address!.state!;

    let orgSlug = slugify(`${org.name}-${state}`);
    let suffix = 2;
    const orgBase = orgSlug;
    while (usedOrgSlugs.has(orgSlug)) {
      orgSlug = `${orgBase}-${suffix}`;
      suffix += 1;
    }
    usedOrgSlugs.add(orgSlug);

    await db.insert(legalAidDirectory).values({
      slug: orgSlug,
      organizationName: org.name,
      organizationStatus: org.status ?? "Active",
      organizationRecognizedDate: org.recognized,
      organizationRecognitionExpiration: org.expiration,
      organizationRecognitionPendingRenewal: false,
      officeType: address!.officeType,
      streetAddress: address!.streetAddress,
      cityStateZip: address!.cityStateZip,
      phone: address!.phone,
      state,
      sourceCitation,
    });

    for (const rep of org.reps) {
      let repSlug = slugify(`${rep.name}-${org.name}-${state}`);
      let repSuffix = 2;
      const repBase = repSlug;
      while (usedRepSlugs.has(repSlug)) {
        repSlug = `${repBase}-${repSuffix}`;
        repSuffix += 1;
      }
      usedRepSlugs.add(repSlug);

      await db.insert(accreditedRepresentativeDirectory).values({
        slug: repSlug,
        representativeName: rep.name,
        dhsOnly: rep.dhsOnly,
        accreditationExpiration: rep.expiration,
        accreditationPendingRenewal: rep.pendingRenewal,
        organizationName: org.name,
        organizationStatus: org.status ?? "Active",
        organizationRecognitionExpiration: org.expiration,
        organizationRecognitionPendingRenewal: false,
        officeType: address!.officeType,
        streetAddress: address!.streetAddress,
        cityStateZip: address!.cityStateZip,
        phone: address!.phone,
        state,
        sourceCitation,
      });
      repsInserted += 1;
    }
  }

  return Response.json({
    reportDate: result.reportDate,
    declaredOrgCount: result.declaredOrgCount,
    orgsBefore,
    orgsAfter: withState.length,
    repsBefore,
    repsAfter: repsInserted,
    excludedNoAddress,
    addressOnlyCount: result.addressOnly.length,
  });
}
