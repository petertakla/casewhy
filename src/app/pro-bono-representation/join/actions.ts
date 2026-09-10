"use server";

import { submitProBonoRepresentationApplication as submitImpl, type ApplyResult } from "@/lib/pro-bono-representation/apply";

export type { ApplyResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function submitProBonoRepresentationApplication(input: {
  organizationName: string;
  contactPerson: string;
  immigrationCourtsServed: string;
  languages?: string;
  caseTypeLimits?: string;
  intakePolicy?: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  website?: string;
}): Promise<ApplyResult> {
  return submitImpl(input);
}
