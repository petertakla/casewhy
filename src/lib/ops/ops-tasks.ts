// Round 112 Part B — a generic "recurring task that needs a real human
// step" queue. First (and so far only) consumer is the monthly
// processing-times refresh: egov.uscis.gov's Cloudflare block (see
// src/lib/kb/processing-times.ts's own header comment) rules out a fully
// automated fetch-and-update job, so the automatable half is noticing
// when a refresh is due and putting a real row in front of whoever's
// running the next Code session -- not relying on someone reading
// check-processing-times-age.ts's CI warning, which nobody's watching on
// a schedule.

import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { opsTasks } from "@/lib/db/schema";

/**
 * Creates a pending ops_task of the given type unless one is already
 * open (status "pending") -- idempotent, safe to call from a monthly
 * cron without ever producing duplicate rows for the same still-unhandled
 * task.
 */
export async function createOpsTaskIfNotOpen(params: {
  type: string;
  title: string;
  description: string;
}): Promise<{ created: boolean }> {
  const db = getDb();
  const existing = await db
    .select({ id: opsTasks.id })
    .from(opsTasks)
    .where(and(eq(opsTasks.type, params.type), eq(opsTasks.status, "pending")))
    .limit(1);

  if (existing.length > 0) return { created: false };

  await db.insert(opsTasks).values({
    type: params.type,
    title: params.title,
    description: params.description,
  });
  return { created: true };
}
