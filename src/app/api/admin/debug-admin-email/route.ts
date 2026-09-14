// Temporary diagnostic: .env.local says ADMIN_EMAIL=info@casewhy.com, but
// round 85's own memory says it was changed to admin@casewhy.com -- these
// disagree, and .env.local may just be stale (never re-pulled after that
// production env var change). Confirming the real production value
// directly before writing it into a manual anyone will act on. Deleted
// right after one real check.

export async function GET(request: Request) {
  const expected = process.env.ADMIN_DIAG_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ adminEmail: process.env.ADMIN_EMAIL ?? null });
}
