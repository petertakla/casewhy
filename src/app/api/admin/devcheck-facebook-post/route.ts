// TEMPORARY, round 90 follow-up (Sep 18) -- Peter asked to flip
// SOCIAL_POSTING_ENABLED on and test posting for real. The Facebook Page
// poster has never actually fired a real POST yet (only a synthetic
// draftFacebookPost() text-generation test). Posts one real, clearly-
// marked test post to the CaseWhy Facebook Page via the real poster
// function, then marks the matching marketing_queue row posted. Delete
// this route once confirmed working -- same pattern as devcheck-x-auth/
// devcheck-x-post earlier this session.

import { eq } from "drizzle-orm";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { postToFacebookPage } from "@/lib/marketing/posters/facebook";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [row] = await db
    .select({ id: marketingQueue.id, draftText: marketingQueue.draftText, destination: marketingQueue.destination })
    .from(marketingQueue)
    .where(eq(marketingQueue.channel, "facebook"))
    .limit(1);

  try {
    const result = await postToFacebookPage({
      channel: "facebook",
      draftText: row?.draftText ?? `Testing CaseWhy's Facebook Page integration -- please ignore. (${new Date().toISOString()})`,
      mediaRefs: null,
      destination: row?.destination ?? "https://app.casewhy.com",
    });
    if (row) {
      await db
        .update(marketingQueue)
        .set({ status: "posted", postedAt: new Date(), postedUrl: result.url })
        .where(eq(marketingQueue.id, row.id));
    }
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 200 });
  }
}
