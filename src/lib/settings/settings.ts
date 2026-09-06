// Round 14 — Settings page: notification toggles + news-source picker.
// Same no-row-means-default convention as src/lib/billing/tier.ts.

import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { userSettings, disabledNewsSources } from "@/lib/db/schema";
import { NEWS_SOURCES } from "@/lib/news/sources";

export async function getStatusChangeEmailsEnabled(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ statusChangeEmailsEnabled: userSettings.statusChangeEmailsEnabled })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return row?.statusChangeEmailsEnabled ?? true;
}

export async function setStatusChangeEmailsEnabled(userId: string, enabled: boolean): Promise<void> {
  const db = getDb();
  await db
    .insert(userSettings)
    .values({ userId, statusChangeEmailsEnabled: enabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { statusChangeEmailsEnabled: enabled, updatedAt: new Date() },
    });
}

/** Every source ID this user has explicitly turned off. Absence from this set means enabled. */
export async function getDisabledNewsSourceIds(userId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select({ sourceId: disabledNewsSources.sourceId })
    .from(disabledNewsSources)
    .where(eq(disabledNewsSources.userId, userId));
  return new Set(rows.map((r) => r.sourceId));
}

/** The set of source IDs to actually fetch for this user — everything except their disabled list. */
export async function getEnabledNewsSourceIds(userId: string | null): Promise<Set<string> | null> {
  if (!userId) return null; // signed-out visitor — every source enabled (see fetchNews)
  const disabled = await getDisabledNewsSourceIds(userId);
  if (disabled.size === 0) return null;
  return new Set(NEWS_SOURCES.map((s) => s.id).filter((id) => !disabled.has(id)));
}

export async function setNewsSourceEnabled(
  userId: string,
  sourceId: string,
  enabled: boolean
): Promise<void> {
  const db = getDb();
  if (enabled) {
    await db
      .delete(disabledNewsSources)
      .where(and(eq(disabledNewsSources.userId, userId), eq(disabledNewsSources.sourceId, sourceId)));
  } else {
    await db
      .insert(disabledNewsSources)
      .values({ userId, sourceId })
      .onConflictDoNothing();
  }
}
