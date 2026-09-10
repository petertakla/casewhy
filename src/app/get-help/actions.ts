"use server";

import { routeVisitorQuery as routeImpl, type RouteResult } from "@/lib/get-help/route-query";

export type { RouteResult };

// A real async function defined in this "use server" file, not a bare
// re-export — see src/app/actions.ts for why (Next's server-action compiler
// expects an actual function definition here).
export async function routeVisitorQuery(freeText: string): Promise<RouteResult> {
  return routeImpl(freeText);
}
