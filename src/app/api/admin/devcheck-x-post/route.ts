// TEMPORARY, X credential debugging (Sep 2026) -- testXCredentials()'s
// GET /2/users/me check doesn't work on X's Free API tier (Free blocks
// most reads, posting only), so it can't confirm whether the pasted
// X_API_KEY/X_API_SECRET/X_ACCESS_TOKEN/X_ACCESS_TOKEN_SECRET actually
// work. Peter explicitly authorized a real one-off test post to check.
// Delete this route (and testXPost() in x.ts) once credentials are
// confirmed working -- same temporary-diagnostic pattern as
// devcheck-x-auth and devcheck-social-senders earlier this project.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { testXPost } from "@/lib/marketing/posters/x";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await testXPost();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
