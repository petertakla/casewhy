// Round 86 — one-off (but idempotent, safe to re-run) setup route: creates
// the nested Gmail labels round 85's task doc specified for
// peter@casewhy.com's platform mail sorting. Does NOT create the filters
// that route mail into these labels — that needs either Peter creating
// them manually in Gmail's own Settings UI, or the gmail.settings.basic
// scope being added to the existing domain-wide delegation grant, neither
// of which this route can do. See createLabelIfMissing's own comment in
// gmail-client.ts and round86-finish-round85-alias-filters-task.md.
//
// Same bearer-secured pattern as the cron routes (reuses CRON_SECRET
// rather than adding a third secret for a route this narrow) — trigger
// manually with curl, not on a schedule.

import { createLabelIfMissing, isGmailApiConfigured } from "@/lib/email-aliases/gmail-client";

// Only the three platforms the task doc named with confidence
// (Reddit/Facebook/Quora) — VisaJourney/Trackitt/immigration.com are left
// out until Peter has actually created an account on each and confirmed a
// real, consistent notification-sending domain exists (round 85 already
// found immigration.com's RSS content is firm announcements, not a signal
// either way about its account-notification sender domain).
const LABELS = ["Peter/Reddit", "Peter/Facebook", "Peter/Quora"];

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailApiConfigured()) {
    return Response.json({ error: "GMAIL_SERVICE_ACCOUNT_KEY not configured." }, { status: 503 });
  }

  const results: Record<string, string> = {};
  const errors: Array<{ label: string; message: string }> = [];

  for (const label of LABELS) {
    try {
      results[label] = await createLabelIfMissing(label);
    } catch (err) {
      errors.push({ label, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({ results, errors });
}
