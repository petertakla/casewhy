"use server";

import { submitDsoApplication as submitImpl, type ApplyResult } from "@/lib/dso/apply";

export type { ApplyResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function submitDsoApplication(input: {
  schoolName: string;
  campusName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  notes?: string;
  website?: string;
}): Promise<ApplyResult> {
  return submitImpl(input);
}
