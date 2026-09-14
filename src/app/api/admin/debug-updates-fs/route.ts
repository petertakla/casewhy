// Temporary diagnostic: confirms content/updates/*.md is actually
// readable from the deployed serverless function's filesystem (Next.js
// file tracing for a dynamic fs.readdirSync() call isn't 100% guaranteed
// the way a static import is). Deleted immediately after one real check
// against production -- see round 93's verification notes.

import { getAllUpdateSlugsFromDisk } from "@/lib/updates/updates";

export async function GET(request: Request) {
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ slugs: getAllUpdateSlugsFromDisk() });
}
