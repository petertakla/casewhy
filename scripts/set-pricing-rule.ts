// Round 50 — the actual "change a price without a code deploy" mechanism
// for CaseWhy Plus. No admin web page (Peter's explicit call after
// reviewing the full spec) — this CLI script is how a pricing_rules row
// gets created, listed, or deactivated. src/lib/billing/pricing.ts reads
// whichever row is active and in-range at checkout time.
//
// Usage:
//   npx tsx scripts/set-pricing-rule.ts add <plan> <fixed_amount|percent> <value> <effective_start> [effective_end] <label>
//   npx tsx scripts/set-pricing-rule.ts list <plan>
//   npx tsx scripts/set-pricing-rule.ts deactivate <rule-id>
//
// <plan>            one of: plus_monthly, plus_quarterly, plus_annual
// <value>            fixed_amount: dollars off (e.g. "2.00" = $2.00 off)
//                     percent: percent off (e.g. "10" = 10% off)
// <effective_start>  YYYY-MM-DD
// <effective_end>    YYYY-MM-DD, or omit for open-ended
// <label>            free-text note, e.g. "Black Friday 2026" — always the
//                     last argument
//
// Examples:
//   npx tsx scripts/set-pricing-rule.ts add plus_monthly fixed_amount 2.00 2026-11-27 2026-12-01 Black Friday 2026
//   npx tsx scripts/set-pricing-rule.ts add plus_annual percent 10 2026-11-27 10% off annual, no end date
//   npx tsx scripts/set-pricing-rule.ts list plus_monthly
//   npx tsx scripts/set-pricing-rule.ts deactivate 3f1c2e4a-...

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { pricingRules } from "../src/lib/db/schema";
import { PLAN_IDS, type PlanId } from "../src/lib/billing/pricing";

function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as string[]).includes(value);
}

function parseDate(value: string, label: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    console.error(`Invalid ${label} "${value}" — expected YYYY-MM-DD.`);
    process.exit(1);
  }
  return date;
}

async function addRule(args: string[]) {
  const [planArg, adjustmentTypeArg, valueArg, startArg, ...rest] = args;
  if (!planArg || !adjustmentTypeArg || !valueArg || !startArg || rest.length === 0) {
    console.error(
      "Usage: npx tsx scripts/set-pricing-rule.ts add <plan> <fixed_amount|percent> <value> <effective_start> [effective_end] <label>"
    );
    process.exit(1);
  }
  if (!isPlanId(planArg)) {
    console.error(`Invalid plan "${planArg}" — expected one of: ${PLAN_IDS.join(", ")}`);
    process.exit(1);
  }
  if (adjustmentTypeArg !== "fixed_amount" && adjustmentTypeArg !== "percent") {
    console.error(`Invalid adjustment type "${adjustmentTypeArg}" — expected "fixed_amount" or "percent".`);
    process.exit(1);
  }

  const value = Number(valueArg);
  if (Number.isNaN(value) || value <= 0) {
    console.error(`Invalid value "${valueArg}" — expected a positive number.`);
    process.exit(1);
  }
  const adjustmentValue =
    adjustmentTypeArg === "fixed_amount" ? Math.round(value * 100) : Math.round(value * 100);
  // fixed_amount: dollars -> cents. percent: e.g. 10 -> 1000 basis points.

  const effectiveStart = parseDate(startArg, "effective_start");
  // If the next token looks like a YYYY-MM-DD date, it's effective_end and
  // everything after it is the label; otherwise effective_end was omitted
  // (open-ended) and everything remaining is the label.
  const nextLooksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(rest[0]);
  const effectiveEnd = nextLooksLikeDate ? parseDate(rest[0], "effective_end") : null;
  const label = (nextLooksLikeDate ? rest.slice(1) : rest).join(" ");
  if (!label) {
    console.error("A label is required as the last argument.");
    process.exit(1);
  }
  if (effectiveEnd && effectiveEnd < effectiveStart) {
    console.error("effective_end must be on or after effective_start.");
    process.exit(1);
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(pricingRules)
    .where(and(eq(pricingRules.planId, planArg), eq(pricingRules.active, true)));

  const overlapping = existing.find((rule) => {
    const otherStart = rule.effectiveStart;
    const otherEnd = rule.effectiveEnd;
    const startsBeforeOtherEnds = otherEnd === null || effectiveStart <= otherEnd;
    const endsAfterOtherStarts = effectiveEnd === null || effectiveEnd >= otherStart;
    return startsBeforeOtherEnds && endsAfterOtherStarts;
  });
  if (overlapping) {
    console.error(
      `Refusing to insert: an active rule already covers an overlapping date range for "${planArg}" — id ${overlapping.id} ("${overlapping.label}", ${overlapping.effectiveStart.toISOString().slice(0, 10)} to ${overlapping.effectiveEnd ? overlapping.effectiveEnd.toISOString().slice(0, 10) : "open-ended"}). Deactivate it first if this is meant to replace it.`
    );
    process.exit(1);
  }

  const [inserted] = await db
    .insert(pricingRules)
    .values({
      planId: planArg,
      adjustmentType: adjustmentTypeArg,
      adjustmentValue,
      effectiveStart,
      effectiveEnd,
      label,
    })
    .returning();

  console.log(
    `Created pricing_rules row ${inserted.id}: ${planArg} ${adjustmentTypeArg === "fixed_amount" ? `-$${value.toFixed(2)}` : `-${value}%`}, ${effectiveStart.toISOString().slice(0, 10)} to ${effectiveEnd ? effectiveEnd.toISOString().slice(0, 10) : "open-ended"} ("${label}").`
  );
}

async function listRules(args: string[]) {
  const [planArg] = args;
  if (!planArg || !isPlanId(planArg)) {
    console.error(`Usage: npx tsx scripts/set-pricing-rule.ts list <plan>\nExpected one of: ${PLAN_IDS.join(", ")}`);
    process.exit(1);
  }

  const db = getDb();
  const rules = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.planId, planArg))
    .orderBy(desc(pricingRules.effectiveStart));

  if (rules.length === 0) {
    console.log(`No pricing_rules rows for "${planArg}".`);
    return;
  }

  for (const rule of rules) {
    const range = `${rule.effectiveStart.toISOString().slice(0, 10)} to ${rule.effectiveEnd ? rule.effectiveEnd.toISOString().slice(0, 10) : "open-ended"}`;
    const amount =
      rule.adjustmentType === "fixed_amount"
        ? `-$${(rule.adjustmentValue / 100).toFixed(2)}`
        : `-${(rule.adjustmentValue / 100).toFixed(2)}%`;
    console.log(`${rule.id}  [${rule.active ? "active" : "inactive"}]  ${amount}  ${range}  "${rule.label}"`);
  }
}

async function deactivateRule(args: string[]) {
  const [ruleId] = args;
  if (!ruleId) {
    console.error("Usage: npx tsx scripts/set-pricing-rule.ts deactivate <rule-id>");
    process.exit(1);
  }

  const db = getDb();
  const [updated] = await db
    .update(pricingRules)
    .set({ active: false })
    .where(eq(pricingRules.id, ruleId))
    .returning();

  if (!updated) {
    console.error(`No pricing_rules row found with id "${ruleId}".`);
    process.exit(1);
  }
  console.log(`Deactivated pricing_rules row ${updated.id} ("${updated.label}").`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "add":
      await addRule(args);
      break;
    case "list":
      await listRules(args);
      break;
    case "deactivate":
      await deactivateRule(args);
      break;
    default:
      console.error(
        "Usage:\n" +
          "  npx tsx scripts/set-pricing-rule.ts add <plan> <fixed_amount|percent> <value> <effective_start> [effective_end] <label>\n" +
          "  npx tsx scripts/set-pricing-rule.ts list <plan>\n" +
          "  npx tsx scripts/set-pricing-rule.ts deactivate <rule-id>"
      );
      process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
