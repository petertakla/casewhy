// TEMPORARY, round 90 prep — Peter just pasted the 4 real X credentials
// into Vercel Production and asked for them to be tested. Calls
// testXCredentials() (GET /2/users/me, read-only, no tweet posted) so a
// bad paste shows up as a clean error instead of a silent "seems fine"
// followed by a real failed post later. Delete this route once the check
// has run and reported back -- it exists only to get a real answer once,
// same pattern as devcheck-social-senders/devpreview114 earlier this
// project.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { testXCredentials } from "@/lib/marketing/posters/x";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const user = await testXCredentials();
    return Response.json({ ok: true, authenticatedAs: user });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
