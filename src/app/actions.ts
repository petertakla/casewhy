"use server";

import { subscribeEmail as subscribeEmailImpl, type SubscribeResult } from "@/lib/marketing/subscribe";

export type { SubscribeResult };

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
