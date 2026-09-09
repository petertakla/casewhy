// Round 46 — one-click approval for a Plus account's case-tracking review
// request (the "11th case" threshold-crossing). No sign-in check by
// design: the whole point is a single click from an emailed link, and the
// token itself is the credential — a long, single-use, unguessable
// random value (crypto.randomUUID()), cleared immediately on use so a
// repeat visit (or a leaked/forwarded link) finds nothing to approve.
//
// Approving raises the account's effectiveMaxCases to the Plus hard
// ceiling (25) and flips every one of that account's pending_review rows
// to active — not just the row that triggered the original notification —
// per the task's own explicit requirement.

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { subscriptions, trackedCases } from "@/lib/db/schema";
import { PLUS_HARD_CEILING_MAX_CASES } from "@/lib/billing/tier";

function htmlResponse(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return htmlResponse("<p>Missing approval token.</p>", 400);
  }

  const db = getDb();
  const [row] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.pendingApprovalToken, token))
    .limit(1);

  if (!row) {
    return htmlResponse("<p>This approval link is invalid or has already been used.</p>", 404);
  }

  await db
    .update(subscriptions)
    .set({ effectiveMaxCases: PLUS_HARD_CEILING_MAX_CASES, pendingApprovalToken: null })
    .where(eq(subscriptions.userId, row.userId));

  await db
    .update(trackedCases)
    .set({ status: "active" })
    .where(and(eq(trackedCases.userId, row.userId), eq(trackedCases.status, "pending_review")));

  return htmlResponse(
    `<p>Approved — this account can now track up to ${PLUS_HARD_CEILING_MAX_CASES} cases, and every case that was pending review is now active.</p>`
  );
}
