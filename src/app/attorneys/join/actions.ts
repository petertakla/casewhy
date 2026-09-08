"use server";

import { submitAttorneyApplication as submitImpl, type ApplyResult } from "@/lib/attorneys/apply";

export type { ApplyResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function submitAttorneyApplication(input: {
  name: string;
  firm: string;
  statesLicensed: string;
  barNumber: string;
  practiceAreas: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
}): Promise<ApplyResult> {
  return submitImpl(input);
}
