// Round 100 — temporary, read-only diagnostic to verify the
// policy-acknowledgment gate treats the new privacy version (September 15,
// 2026) as stale for an existing account, without needing to sign in as
// one (credentials are off-limits per the standard safety rules) and
// without a readable DATABASE_URL locally (it's a Vercel "Secret", same
// gotcha as ADMIN_DIAG_SECRET before --type config). Bearer-secured with
// ADMIN_DIAG_SECRET, same pattern as test-postmark-send and
// setup-community-labels. Delete once round 100 is verified.

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getStalePolicies } from "@/lib/policy/acknowledgments";

export async function GET(request: Request) {
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const result = await db.execute<{ id: string; email: string; createdAt: string }>(
    sql`SELECT id, email, "createdAt" FROM neon_auth."user" ORDER BY "createdAt" ASC LIMIT 5`
  );

  const rows = await Promise.all(
    result.rows.map(async (u) => {
      const stale = await getStalePolicies(u.id, new Date(u.createdAt));
      return {
        emailMasked: u.email.replace(/^(.).*(@.*)$/, "$1***$2"),
        accountCreatedAt: u.createdAt,
        stalePolicies: stale.map((s) => ({ type: s.type, version: s.version })),
      };
    })
  );

  return Response.json({ userCount: result.rows.length, rows });
}
