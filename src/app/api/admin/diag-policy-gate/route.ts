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

// POST — disposable fixture test: insert → exercise → delete, same pattern
// this session has used against other tables all round. neon_auth.user has
// zero real rows in production right now (confirmed by GET above, matching
// round 69's own note that this was true then too), so this is the only
// way to exercise getStalePolicies() against a genuinely pre-existing
// account without a real signed-up user to test with.
export async function POST(request: Request) {
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const fixtureEmail = `round100-fixture-${Date.now()}@casewhy.com`;
  const oldCreatedAt = new Date("2026-01-01T00:00:00Z");

  const inserted = await db.execute<{ id: string }>(
    sql`INSERT INTO neon_auth."user" (name, email, "emailVerified", "createdAt", "updatedAt")
        VALUES ('Round 100 Fixture', ${fixtureEmail}, true, ${oldCreatedAt.toISOString()}, ${oldCreatedAt.toISOString()})
        RETURNING id`
  );
  const userId = inserted.rows[0].id;

  let stale;
  let error: string | null = null;
  try {
    stale = await getStalePolicies(userId, oldCreatedAt);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  } finally {
    await db.execute(sql`DELETE FROM neon_auth."user" WHERE id = ${userId}`);
  }

  return Response.json({
    fixtureAccountCreatedAt: oldCreatedAt.toISOString(),
    stalePolicies: stale?.map((s) => ({ type: s.type, version: s.version })) ?? null,
    error,
    cleanedUp: true,
  });
}
