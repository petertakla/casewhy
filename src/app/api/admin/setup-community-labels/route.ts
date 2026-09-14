// Round 86 — one-off (but idempotent, safe to re-run) setup route: creates
// the nested Gmail labels round 85's task doc specified for
// peter@casewhy.com's platform mail sorting.
//
// Round 87 pushed back on round 86's claim that filter creation needs
// Peter's own manual action — asked for the real API error, not a
// repeated inference from scope documentation. So this route now also
// runs a real, self-cleaning test filter creation
// (testFilterCreationScope) and reports the actual outcome. If it turns
// out gmail.settings.basic IS covered, real filters get built for each
// label too, using each platform's known notification-sending domain —
// see PLATFORM_DOMAINS below for which ones are actually confirmed
// (verify-before-building, not guessed, per every task doc in this
// thread).
//
// Same bearer-secured pattern as the cron routes (reuses CRON_SECRET
// rather than adding a third secret for a route this narrow) — trigger
// manually with curl, not on a schedule.

import {
  createLabelIfMissing,
  createFilter,
  getLabelId,
  testFilterCreationScope,
  isGmailApiConfigured,
} from "@/lib/email-aliases/gmail-client";

const PETER_ADDRESS = "peter@casewhy.com";

// No platform's sending domain is independently confirmed yet.
// "mail.redditmail.com" appears in round 85's own task doc, but only as
// an "e.g." illustration, not a checked fact — and round 85/86/87 all
// repeat the same instruction: verify each domain against a real
// notification email before building a filter on it, don't guess.
// Nobody has confirmed a platform account exists yet (asked directly in
// round 86, still unanswered as of this round) — so this map stays empty
// on purpose until a real email exists to check. Fill it in per-platform
// only once verified.
const LABELS = ["Peter/Reddit", "Peter/Facebook", "Peter/Quora"];
const CONFIRMED_PLATFORM_DOMAINS: Record<string, string> = {};

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailApiConfigured()) {
    return Response.json({ error: "GMAIL_SERVICE_ACCOUNT_KEY not configured." }, { status: 503 });
  }

  const labelResults: Record<string, string> = {};
  const errors: Array<{ step: string; message: string }> = [];

  for (const label of LABELS) {
    try {
      labelResults[label] = await createLabelIfMissing(label);
    } catch (err) {
      errors.push({ step: `label:${label}`, message: err instanceof Error ? err.message : String(err) });
    }
  }

  const scopeCheck = await testFilterCreationScope();

  const filterResults: Record<string, string> = {};
  if (scopeCheck.works) {
    for (const [label, domain] of Object.entries(CONFIRMED_PLATFORM_DOMAINS)) {
      try {
        const labelId = await getLabelId(label);
        if (!labelId) {
          filterResults[label] = "skipped: label id not found (label creation must have failed above)";
          continue;
        }
        const result = await createFilter({ toAddress: PETER_ADDRESS, fromDomain: domain, labelId });
        filterResults[label] = `created, filter id ${result.id}`;
      } catch (err) {
        errors.push({ step: `filter:${label}`, message: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  return Response.json({ labelResults, filterScopeCheck: scopeCheck, filterResults, errors });
}
