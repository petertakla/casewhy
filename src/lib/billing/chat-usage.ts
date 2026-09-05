// CW-35's chat metering. See src/lib/billing/tier.ts for the confirmed
// limits and the "schema/logic only, not live billing" caveat.

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { chatUsage } from "@/lib/db/schema";
import { TIER_LIMITS, type SubscriptionTier } from "./tier";

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-09", UTC
}

export interface ChatUsageStatus {
  used: number;
  /** null = unlimited (paid tier) */
  limit: number | null;
  remaining: number | null;
  limitReached: boolean;
}

export async function getChatUsage(userId: string, tier: SubscriptionTier): Promise<ChatUsageStatus> {
  const db = getDb();
  const yearMonth = currentYearMonth();
  const [row] = await db
    .select({ count: chatUsage.count })
    .from(chatUsage)
    .where(and(eq(chatUsage.userId, userId), eq(chatUsage.yearMonth, yearMonth)))
    .limit(1);

  const used = row?.count ?? 0;
  const limit = TIER_LIMITS[tier].chatQuestionsPerMonth;
  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    limitReached: limit !== null && used >= limit,
  };
}

/** Increments this month's count by one. Call only after a successful chat reply. */
export async function incrementChatUsage(userId: string): Promise<void> {
  const db = getDb();
  const yearMonth = currentYearMonth();
  await db
    .insert(chatUsage)
    .values({ userId, yearMonth, count: 1 })
    .onConflictDoUpdate({
      target: [chatUsage.userId, chatUsage.yearMonth],
      set: { count: sql`${chatUsage.count} + 1` },
    });
}
