// Round 110 — logs one search_events row: query, locale, per-group result
// counts, and outcome (clicked a result, fell through to Ask CaseWhy, or
// abandoned). Deliberately no user id, no IP (task doc's own instruction)
// -- this exists purely for the weekly "what do people look for and not
// find" review on /admin/search, not per-user tracking. Best-effort: a
// failed log call never blocks the search UI itself.

import { getDb } from "@/lib/db/client";
import { searchEvents } from "@/lib/db/schema";

interface LogEventBody {
  query: string;
  locale: string;
  resultCounts: Record<string, number>;
  outcome: "clicked_result" | "asked_casewhy" | "abandoned";
}

export async function POST(request: Request) {
  let body: LogEventBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.query || !body.locale || !body.outcome) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  await db.insert(searchEvents).values({
    query: body.query.slice(0, 200),
    locale: body.locale,
    resultCounts: Object.entries(body.resultCounts ?? {})
      .map(([k, v]) => `${k}:${v}`)
      .join(", "),
    outcome: body.outcome,
  });

  return Response.json({ ok: true });
}
