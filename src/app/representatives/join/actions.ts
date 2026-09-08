"use server";

import { submitRepresentativeApplication as submitImpl, type ApplyResult } from "@/lib/representatives/apply";

export type { ApplyResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function submitRepresentativeApplication(input: {
  name: string;
  organization: string;
  accreditationDetails: string;
  statesServed: string;
  practiceFocus: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
}): Promise<ApplyResult> {
  return submitImpl(input);
}
