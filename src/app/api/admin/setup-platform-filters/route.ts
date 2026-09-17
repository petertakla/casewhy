// Round 113 follow-up (Sep 17) — per-platform Social Media/* filters,
// built only once a real verification email from that platform confirmed
// a real sender domain (round 87's rule: never guess a sender domain).
// devcheck-social-senders (temporary diagnostic) found real senders for
// X, Instagram, and Threads in info@'s inbox; Facebook/Meta's own senders
// (facebookmail.com, account.meta.com) are account-level, not clearly
// Facebook-specific, and were deliberately left out pending Peter's call.
// YouTube/TikTok/Pinterest have no real sender yet -- those accounts
// don't appear to exist yet.
//
// Deliberately additive, not a replacement for the existing catch-all
// (`to:social@casewhy.com` -> Social Media/Other, round 113): a message
// from x.com now gets both Social Media/X and Social Media/Other. Mildly
// redundant, not broken -- narrowing the catch-all to exclude these
// domains is a separate, optional follow-up, not done here.

import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { createFilter, filterExists, getLabelId } from "@/lib/email-aliases/gmail-client";

const PLATFORM_FILTERS = [
  { fromDomain: "x.com", labelName: "Social Media/X" },
  { fromDomain: "mail.instagram.com", labelName: "Social Media/Instagram" },
  { fromDomain: "mail.threads.net", labelName: "Social Media/Threads" },
];

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  for (const { fromDomain, labelName } of PLATFORM_FILTERS) {
    const labelId = await getLabelId(labelName);
    if (!labelId) {
      results[labelName] = "label not found";
      continue;
    }
    const already = await filterExists({ to: "social@casewhy.com", from: fromDomain, labelId });
    if (already) {
      results[labelName] = "already existed";
      continue;
    }
    try {
      await createFilter({ toAddress: "social@casewhy.com", fromDomain, labelId });
      results[labelName] = "created";
    } catch (err) {
      results[labelName] = `failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return Response.json(results);
}
