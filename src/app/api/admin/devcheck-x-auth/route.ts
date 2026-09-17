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

// Real 401 seen on the first live run of this check -- added a safe
// "does this value have stray whitespace" probe (length before/after
// trim only, never the value itself) since a trailing newline from a
// paste is a common, real cause of exactly this failure mode with
// OAuth 1.0a's exact-string signing.
function whitespaceCheck(name: string): { name: string; set: boolean; hasWhitespace: boolean; length: number } {
  const raw = process.env[name];
  if (!raw) return { name, set: false, hasWhitespace: false, length: 0 };
  return { name, set: true, hasWhitespace: raw !== raw.trim(), length: raw.length };
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const whitespace = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"].map(whitespaceCheck);

  try {
    const user = await testXCredentials();
    return Response.json({ ok: true, authenticatedAs: user, whitespace });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err), whitespace }, { status: 200 });
  }
}
