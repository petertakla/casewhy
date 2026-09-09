// Round 50 — table-driven CaseWhy Plus pricing. The `plan_prices` +
// `pricing_rules` tables are the actual mechanism: a future price change is
// a data change via scripts/set-pricing-rule.ts, not a code deploy. No
// admin web page (Peter's explicit call after reviewing the full spec).

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { planPrices, pricingRules } from "@/lib/db/schema";

export type PlanId = "plus_monthly" | "plus_quarterly" | "plus_annual";

export const PLAN_IDS: PlanId[] = ["plus_monthly", "plus_quarterly", "plus_annual"];

export const PLAN_LABELS: Record<PlanId, string> = {
  plus_monthly: "CaseWhy Plus (Monthly)",
  plus_quarterly: "CaseWhy Plus (Quarterly)",
  plus_annual: "CaseWhy Plus (Annual)",
};

export interface EffectivePrice {
  planId: PlanId;
  priceCents: number;
  billingInterval: "month" | "year";
  intervalCount: number;
  /** null if no pricing_rules adjustment is currently active for this plan. */
  appliedRuleLabel: string | null;
}

/** The plan's base price plus whichever pricing_rules adjustment (if any) is active today. */
export async function getEffectivePrice(planId: PlanId): Promise<EffectivePrice> {
  const db = getDb();
  const [plan] = await db.select().from(planPrices).where(eq(planPrices.planId, planId));
  if (!plan) {
    throw new Error(`No plan_prices row for plan "${planId}" — seed migration may not have run.`);
  }

  const now = new Date();
  const rules = await db
    .select()
    .from(pricingRules)
    .where(and(eq(pricingRules.planId, planId), eq(pricingRules.active, true)))
    .orderBy(desc(pricingRules.createdAt));

  const applicable = rules.filter(
    (r) => r.effectiveStart <= now && (r.effectiveEnd === null || r.effectiveEnd >= now)
  );

  if (applicable.length > 1) {
    console.warn(
      `Multiple active pricing_rules for plan "${planId}" on ${now.toISOString()} — using the most recently created (id ${applicable[0].id}). The set-pricing-rule.ts overlap guard should prevent this.`
    );
  }
  const rule = applicable[0] ?? null;

  let priceCents = plan.basePriceCents;
  if (rule) {
    priceCents =
      rule.adjustmentType === "fixed_amount"
        ? priceCents - rule.adjustmentValue
        : Math.round((priceCents * (10000 - rule.adjustmentValue)) / 10000);
    priceCents = Math.max(priceCents, 0);
  }

  return {
    planId,
    priceCents,
    billingInterval: plan.billingInterval,
    intervalCount: plan.intervalCount,
    appliedRuleLabel: rule?.label ?? null,
  };
}

export async function getAllEffectivePrices(): Promise<Record<PlanId, EffectivePrice>> {
  const entries = await Promise.all(PLAN_IDS.map(async (id) => [id, await getEffectivePrice(id)] as const));
  return Object.fromEntries(entries) as Record<PlanId, EffectivePrice>;
}
