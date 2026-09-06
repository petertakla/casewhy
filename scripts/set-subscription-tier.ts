// Round 12 — the manual/debug path for flipping an account's subscription
// tier, since there's no live payment processor to set it through yet.
// Deliberately a CLI script, not a web-exposed endpoint — smaller attack
// surface than inventing an ad-hoc "gated to Peter" auth check.
//
// Usage:
//   npx tsx scripts/set-subscription-tier.ts you@example.com plus
//   npx tsx scripts/set-subscription-tier.ts you@example.com free

import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { subscriptions } from "../src/lib/db/schema";

async function main() {
  const [email, tier] = process.argv.slice(2);
  if (!email || (tier !== "free" && tier !== "plus")) {
    console.error("Usage: npx tsx scripts/set-subscription-tier.ts <email> <free|plus>");
    process.exit(1);
  }

  const db = getDb();
  const result = await db.execute<{ id: string }>(
    sql`SELECT id FROM neon_auth."user" WHERE email = ${email} LIMIT 1`
  );
  const user = result.rows[0];
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  await db
    .insert(subscriptions)
    .values({ userId: user.id, tier })
    .onConflictDoUpdate({ target: subscriptions.userId, set: { tier, updatedAt: new Date() } });

  console.log(`Set ${email} (userId ${user.id}) to tier "${tier}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
