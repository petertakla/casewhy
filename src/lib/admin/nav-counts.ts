// Round 98 — server-only pending-count queries for the admin nav registry
// (src/lib/admin/nav.ts). Split out specifically so AdminShellClient.tsx
// (a client component) can import the registry's metadata without ever
// pulling `pg` into the browser bundle — see nav.ts's own comment.

import { count, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { marketingQueue, pendingAliasActions, pendingBacklinkOutreach } from "../db/schema";
import { ADMIN_NAV } from "./nav";

async function pendingQueueCount(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(marketingQueue)
    .where(inArray(marketingQueue.status, ["pending", "escalated"]));
  return row?.n ?? 0;
}

async function pendingAliasRepliesCount(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(pendingAliasActions)
    .where(eq(pendingAliasActions.status, "pending"));
  return row?.n ?? 0;
}

async function pendingBacklinkDraftsCount(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(pendingBacklinkOutreach)
    .where(eq(pendingBacklinkOutreach.status, "pending"));
  return row?.n ?? 0;
}

const COUNTERS: Record<string, () => Promise<number>> = {
  "/admin/marketing": pendingQueueCount,
  "/admin/inbox": pendingAliasRepliesCount,
  "/admin/backlink-outreach": pendingBacklinkDraftsCount,
};

/** href -> live pending count, for every registry entry with hasPendingCount. */
export async function getAdminPendingCounts(): Promise<Record<string, number>> {
  const entries = ADMIN_NAV.filter((e) => e.hasPendingCount);
  const pairs = await Promise.all(entries.map(async (e) => [e.href, await COUNTERS[e.href]()] as const));
  return Object.fromEntries(pairs);
}
