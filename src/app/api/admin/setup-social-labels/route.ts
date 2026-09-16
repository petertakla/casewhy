// Round 113 Part C — creates the real Social Media/* labels matching
// Peter's own live reorganization (confirmed via a real label-list dump,
// not assumed from the task doc's original "Social/X" naming or its
// "Facebook + Instagram + Threads under one Meta label" merge -- Peter's
// direct instruction, same day: no combined Meta label, each platform
// gets its own label, unclassified mail goes to Social Media/Other).
//
// The original "Social/*" labels this route created before the
// reorganization (Social/X, Social/Meta, Social/YouTube, Social/TikTok,
// Social/Pinterest, Social/Other) are now stale leftovers under the
// wrong prefix -- left in place rather than auto-deleted (this route has
// no delete capability, and removing labels someone else's Gmail account
// wasn't asked for); safe for Peter to delete by hand if he wants.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { createLabelIfMissing, getLabelId, createFilter, filterExists } from "@/lib/email-aliases/gmail-client";

const SOCIAL_LABELS = [
  "Social Media/X",
  "Social Media/Facebook",
  "Social Media/Instagram",
  "Social Media/Threads",
  "Social Media/YouTube",
  "Social Media/TikTok",
  "Social Media/Pinterest",
  "Social Media/Other",
];

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
    const otherLabelId = await getLabelId("Social Media/Other");
    if (!otherLabelId) {
      return NextResponse.json({ labels: labelResults, error: "Social Media/Other label id not found right after creating it." }, { status: 500 });
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
    // Filter creation is expected to fail here (gmail.settings.basic
    // never granted) -- the labels above are the real deliverable of
    // this route; the filter itself is Peter's own manual step, same as
    // press@ and social@'s other filters.
    return NextResponse.json(
      { labels: labelResults, catchAllFilter: null, filterError: err instanceof Error ? err.message : String(err), stage: "filter" },
      { status: 500 }
    );
  }
}
