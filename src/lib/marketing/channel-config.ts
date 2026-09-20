// Round 119 — per-channel config for the /admin/ops "Social channels"
// table. See schema.ts's own comment on socialChannelConfigs for the
// facebook carve-out (mode is never read from here for that channel).

import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { socialChannelConfigs, marketingQueue } from "../db/schema";

export interface SocialChannelConfig {
  channel: string;
  minIntervalMinutes: number;
  mode: "manual_post" | "auto_post";
  enabled: boolean;
  notes: string | null;
}

// A channel with no row here (one added to REGISTERED_POSTER_CHANNELS
// after this table was seeded, e.g. a future LinkedIn poster) behaves
// exactly as it would have before this table existed: enabled, no
// throttle, manual_post until an admin explicitly configures it --
// same "unconfigured means off/manual, not guessed at" convention as
// registry.ts's own getPosterForChannel() fallback.
const DEFAULT_CONFIG: Omit<SocialChannelConfig, "channel"> = {
  minIntervalMinutes: 0,
  mode: "manual_post",
  enabled: true,
  notes: null,
};

export async function getSocialChannelConfig(channel: string): Promise<SocialChannelConfig> {
  const db = getDb();
  const [row] = await db.select().from(socialChannelConfigs).where(eq(socialChannelConfigs.channel, channel as (typeof socialChannelConfigs.$inferSelect)["channel"])).limit(1);
  if (!row) return { channel, ...DEFAULT_CONFIG };
  return { channel: row.channel, minIntervalMinutes: row.minIntervalMinutes, mode: row.mode, enabled: row.enabled, notes: row.notes };
}

export async function listSocialChannelConfigs(): Promise<Array<typeof socialChannelConfigs.$inferSelect>> {
  const db = getDb();
  return db.select().from(socialChannelConfigs).orderBy(socialChannelConfigs.channel);
}

/**
 * Whether a new draft should be created for this channel right now:
 * enabled, and (if minIntervalMinutes > 0) no row for this channel was
 * already created within that window. Checked once per drafting attempt
 * (before the LLM call, not after) so a disabled or throttled channel
 * costs nothing beyond this one query -- same spirit as poll-aliases'
 * own isDue() check, applied to a live query instead of a stored
 * lastPolledAt column, since multiple cron routes can create rows for
 * the same channel and a single shared timestamp column would need
 * coordinating between them.
 */
export async function isChannelPostable(channel: string): Promise<boolean> {
  const config = await getSocialChannelConfig(channel);
  if (!config.enabled) return false;
  if (config.minIntervalMinutes <= 0) return true;

  const db = getDb();
  const since = new Date(Date.now() - config.minIntervalMinutes * 60_000);
  const recent = await db
    .select({ id: marketingQueue.id })
    .from(marketingQueue)
    .where(and(eq(marketingQueue.channel, channel as (typeof marketingQueue.$inferSelect)["channel"]), gte(marketingQueue.createdAt, since)))
    .limit(1);
  return recent.length === 0;
}

export async function upsertSocialChannelConfig(
  channel: string,
  values: { minIntervalMinutes: number; mode: "manual_post" | "auto_post"; enabled: boolean; notes: string | null }
): Promise<void> {
  const db = getDb();
  await db
    .insert(socialChannelConfigs)
    .values({ channel: channel as (typeof socialChannelConfigs.$inferInsert)["channel"], ...values })
    .onConflictDoUpdate({
      target: socialChannelConfigs.channel,
      set: { ...values, updatedAt: sql`now()` },
    });
}
