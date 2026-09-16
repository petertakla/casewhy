// Round 113 Part C — creates the six Social/* labels under info@casewhy.com
// and one catch-all filter (to:social@casewhy.com -> Social/Other) so
// nothing is lost before real per-platform sender domains exist to filter
// on individually (round 87's own rule: verify a sender domain against a
// real email before writing a filter for it -- that happens after Peter's
// Sep 17-18 sign-up slot produces real verification emails, a follow-up
// action, not this route).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { createLabelIfMissing, getLabelId, createFilter, filterExists } from "@/lib/email-aliases/gmail-client";

const SOCIAL_LABELS = ["Social/X", "Social/Meta", "Social/YouTube", "Social/TikTok", "Social/Pinterest", "Social/Other"];
// Peter/VisaJourney (the doc's own "add it the same way as Peter/Reddit"
// instruction) deliberately NOT included here: Peter/Reddit lives in
// peter@casewhy.com's own mailbox, per the task doc, which may be a
// genuinely separate Workspace user from info@casewhy.com -- this
// service account's domain-wide delegation is only confirmed working
// against info@ (GMAIL_IMPERSONATE_EMAIL). Guessing at a second
// impersonation target risks writing to (or erroring against) the wrong
// mailbox; flagged as a real open question rather than assumed.

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Round 113 -- real labels and the filter go through two different
  // Gmail API scopes (gmail.labels vs. gmail.settings.basic, the latter
  // never granted per round 86/87's own already-documented finding).
  // Reporting partial success on a mid-sequence failure, not swallowing
  // real progress behind one thrown error.
  const labelResults: Record<string, string> = {};
  try {
    for (const label of SOCIAL_LABELS) {
      labelResults[label] = await createLabelIfMissing(label);
    }
  } catch (err) {
    return NextResponse.json(
      { labels: labelResults, catchAllFilter: null, filterError: err instanceof Error ? err.message : String(err), stage: "labels" },
      { status: 500 }
    );
  }

  try {
    const otherLabelId = await getLabelId("Social/Other");
    if (!otherLabelId) {
      return NextResponse.json({ labels: labelResults, error: "Social/Other label id not found right after creating it." }, { status: 500 });
    }

    const toAddress = "social@casewhy.com";
    let filterResult: "created" | "already_existed";
    if (await filterExists({ to: toAddress, labelId: otherLabelId })) {
      filterResult = "already_existed";
    } else {
      await createFilter({ toAddress, labelId: otherLabelId });
      filterResult = "created";
    }

    return NextResponse.json({ labels: labelResults, catchAllFilter: filterResult });
  } catch (err) {
    return NextResponse.json(
      { labels: labelResults, catchAllFilter: null, filterError: err instanceof Error ? err.message : String(err), stage: "filter" },
      { status: 500 }
    );
  }
}
