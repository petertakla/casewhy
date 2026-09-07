// Round 14, revised round 17 — Settings page: notification toggles +
// news-source picker. The email toggle keeps the no-row-means-default
// convention from src/lib/billing/tier.ts; the news-source picker keeps
// that same "no row = default" idea but per-source, since round 17 made
// the default itself vary by source (see NEWS_SOURCES' `defaultOn`).

import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { userSettings, newsSourcePreferences } from "@/lib/db/schema";
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

/** Every source ID this user has explicitly toggled away from its own default, and what they set it to. */
export async function getNewsSourceOverrides(userId: string): Promise<Map<string, boolean>> {
  const db = getDb();
  const rows = await db
    .select({ sourceId: newsSourcePreferences.sourceId, enabled: newsSourcePreferences.enabled })
    .from(newsSourcePreferences)
    .where(eq(newsSourcePreferences.userId, userId));
  return new Map(rows.map((r) => [r.sourceId, r.enabled]));
}

/**
 * The set of source IDs to actually fetch/show as checked for this user —
 * each source's own `defaultOn`, unless this user has an explicit override.
 * A signed-out visitor (userId === null) always sees plain defaults.
 */
export async function getEnabledNewsSourceIds(userId: string | null): Promise<Set<string>> {
  const overrides = userId ? await getNewsSourceOverrides(userId) : new Map<string, boolean>();
  const enabled = new Set<string>();
  for (const source of NEWS_SOURCES) {
    const isEnabled = overrides.has(source.id) ? overrides.get(source.id)! : source.defaultOn;
    if (isEnabled) enabled.add(source.id);
  }
  return enabled;
}

export async function setNewsSourceEnabled(
  userId: string,
  sourceId: string,
  enabled: boolean
): Promise<void> {
  const db = getDb();
  const source = NEWS_SOURCES.find((s) => s.id === sourceId);

  // Setting it back to the source's own default needs no row at all —
  // keeps the table storing only genuine deviations, same "no row for the
  // common case" efficiency the previous opt-out-only design had.
  if (source && enabled === source.defaultOn) {
    await db
      .delete(newsSourcePreferences)
      .where(and(eq(newsSourcePreferences.userId, userId), eq(newsSourcePreferences.sourceId, sourceId)));
    return;
  }

  await db
    .insert(newsSourcePreferences)
    .values({ userId, sourceId, enabled })
    .onConflictDoUpdate({
      target: [newsSourcePreferences.userId, newsSourcePreferences.sourceId],
      set: { enabled },
    });
}
