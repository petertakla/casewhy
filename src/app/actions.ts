"use server";

import { subscribeEmail as subscribeEmailImpl, type SubscribeResult } from "@/lib/marketing/subscribe";
import { submitListingReport as submitListingReportImpl, type ReportResult } from "@/lib/reports/report";

export type { SubscribeResult, ReportResult };

// A real async function defined in this "use server" file, not a bare
// re-export — Next.js's server-action compiler expects an actual function
// definition here, not just a passthrough reference to another module.
export async function subscribeEmail(input: {
  email: string;
  sourcePage: string;
  website?: string;
}): Promise<SubscribeResult> {
  return subscribeEmailImpl(input);
}

// Round 41 — shared across all three live Get Help entity types (and every
// future one), rather than a per-entity-type wrapper like the join forms
// have, since this is the exact same action regardless of what's being
// reported.
export async function submitListingReport(input: {
  entityType: string;
  entityId: string;
  entityName: string;
  reportText: string;
  reporterEmail?: string;
  website?: string;
}): Promise<ReportResult> {
  return submitListingReportImpl(input);
}
