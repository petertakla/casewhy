// Round 116 — posts marketing_queue rows that are "approved" and whose
// own scheduledFor has arrived. The only rows that ever carry a
// scheduledFor are the evergreen weekday fallback's (see
// src/lib/marketing/evergreen/generate-weekday-evergreen.ts) -- approving
// one of those on approveForAutoPost intentionally leaves it at
// "approved" without posting so a whole week can be approved in one
// Sunday-evening sitting; this route is what actually posts each one on
// its own day. Same bearer-secured-cron pattern as every other route
// (isAuthorizedCronRequest), same poster-lookup/error-handling shape as
// postQueueItem in src/app/admin/marketing/actions.ts -- duplicated
// rather than imported, since that file is a "use server" action module
// gated on an interactive admin session (requireAdmin), not meant to be
// called from a bearer-secured cron context.

import { and, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { isAuthorizedCronRequest } from "@/lib/auth/cron-auth";
import { getPosterForChannel } from "@/lib/marketing/posters/registry";
import { getSocialPostingEnabled } from "@/lib/marketing/config";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Same master switch approveForAutoPost itself checks -- a scheduled
  // post whose date has arrived still shouldn't go out while posting is
  // globally paused. It stays "approved" and this route picks it up on a
  // later run once the switch is back on.
  if (!(await getSocialPostingEnabled())) {
    return Response.json({ posted: 0, failed: 0, skippedSwitchOff: true });
  }

  const due = await db
    .select({
      id: marketingQueue.id,
      channel: marketingQueue.channel,
      draftText: marketingQueue.draftText,
      mediaRefs: marketingQueue.mediaRefs,
      destination: marketingQueue.destination,
    })
    .from(marketingQueue)
    .where(and(eq(marketingQueue.status, "approved"), isNotNull(marketingQueue.scheduledFor), lte(marketingQueue.scheduledFor, new Date())));

  let posted = 0;
  let failed = 0;
  const errors: Array<{ id: string; message: string }> = [];

  for (const row of due) {
    const poster = getPosterForChannel(row.channel);
    if (!poster) continue; // shouldn't happen -- scheduledFor is only ever set on auto_post rows with a registered poster.
    try {
      const result = await poster({ channel: row.channel, draftText: row.draftText ?? "", mediaRefs: row.mediaRefs, destination: row.destination });
      await db.update(marketingQueue).set({ status: "posted", postedAt: new Date(), postedUrl: result.url }).where(eq(marketingQueue.id, row.id));
      posted++;
    } catch (err) {
      failed++;
      errors.push({ id: row.id, message: err instanceof Error ? err.message : String(err) });
      // Left at "approved" (not reverted to "pending" the way postQueueItem
      // does) -- a scheduled post that failed still has real reviewed
      // text and a real approval on record; this route will just retry it
      // on the next run rather than sending it back through manual review.
    }
  }

  return Response.json({ due: due.length, posted, failed, errors });
}
