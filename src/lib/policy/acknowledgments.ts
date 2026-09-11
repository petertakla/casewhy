// Round 69, Part 1 — the only reader/writer of policy_acknowledgments.
// Keeping both functions here (rather than inlined in middleware.ts and a
// server action separately) so the "what counts as stale" logic can't drift
// between the gate that blocks navigation and the action that clears it.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { policyAcknowledgments } from "@/lib/db/schema";
import { POLICY_VERSIONS, type PolicyType, type PolicyVersionInfo } from "./versions";

export interface StalePolicy extends PolicyVersionInfo {
  type: PolicyType;
}

/**
 * Which policies (if any) this user needs to actively acknowledge before
 * continuing. An account created on/after a policy's effectiveDate already
 * agreed to that version at signup — nothing has changed since they
 * joined — so it's never gated for it; only accounts that predate a later
 * material change see the gate for that change.
 */
export async function getStalePolicies(userId: string, accountCreatedAt: Date): Promise<StalePolicy[]> {
  const db = getDb();
  const acks = await db.select().from(policyAcknowledgments).where(eq(policyAcknowledgments.userId, userId));

  const stale: StalePolicy[] = [];
  for (const type of Object.keys(POLICY_VERSIONS) as PolicyType[]) {
    const info = POLICY_VERSIONS[type];
    if (accountCreatedAt >= info.effectiveDate) continue;

    const latestAck = acks
      .filter((a) => a.policyType === type)
      .sort((a, b) => b.acknowledgedAt.getTime() - a.acknowledgedAt.getTime())[0];

    if (!latestAck || latestAck.version !== info.version) {
      stale.push({ type, ...info });
    }
  }
  return stale;
}

export async function acknowledgePolicy(userId: string, type: PolicyType): Promise<void> {
  const db = getDb();
  await db.insert(policyAcknowledgments).values({
    userId,
    policyType: type,
    version: POLICY_VERSIONS[type].version,
  });
}
