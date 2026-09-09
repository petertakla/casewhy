"use server";

import { submitCommunityOrgApplication as submitImpl, type ApplyResult } from "@/lib/community-orgs/apply";

export type { ApplyResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function submitCommunityOrgApplication(input: {
  organizationName: string;
  orgType: string;
  contactPerson: string;
  statesServed: string;
  populationServed: string;
  servicesOffered: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  website?: string;
}): Promise<ApplyResult> {
  return submitImpl(input);
}
