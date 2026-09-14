// Round 93 Part C — shared aggregation, used by both
// /admin/marketing/attribution (the page) and the weekly digest cron, so
// the two never drift on what "landings/sign-ups/tracked/plus" means.

import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { firstTouchAttribution, marketingLandingCounts, trackedCases, subscriptions } from "../db/schema";

export interface AttributionRow {
  source: string;
  medium: string;
  campaign: string;
  landings: number;
  signUps: number;
  trackedCases: number;
  plusConversions: number;
}

function keyOf(source: string, medium: string, campaign: string): string {
  return `${source} ${medium} ${campaign}`;
}

export async function getAttributionRows(): Promise<AttributionRow[]> {
  const db = getDb();
  const [landings, touches, trackedRows, plusRows] = await Promise.all([
    db.select().from(marketingLandingCounts),
    db.select().from(firstTouchAttribution),
    db.select({ userId: trackedCases.userId }).from(trackedCases),
    db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.tier, "plus")),
  ]);

  const trackedUserIds = new Set(trackedRows.map((r) => r.userId));
  const plusUserIds = new Set(plusRows.map((r) => r.userId));

  const byKey = new Map<string, AttributionRow>();

  for (const l of landings) {
    byKey.set(keyOf(l.source, l.medium, l.campaign), {
      source: l.source,
      medium: l.medium,
      campaign: l.campaign,
      landings: l.count,
      signUps: 0,
      trackedCases: 0,
      plusConversions: 0,
    });
  }

  for (const t of touches) {
    const key = keyOf(t.source, t.medium, t.campaign);
    let row = byKey.get(key);
    if (!row) {
      row = { source: t.source, medium: t.medium, campaign: t.campaign, landings: 0, signUps: 0, trackedCases: 0, plusConversions: 0 };
      byKey.set(key, row);
    }
    row.signUps += 1;
    if (trackedUserIds.has(t.userId)) row.trackedCases += 1;
    if (plusUserIds.has(t.userId)) row.plusConversions += 1;
  }

  return [...byKey.values()].sort((a, b) => b.landings - a.landings || b.signUps - a.signUps);
}
