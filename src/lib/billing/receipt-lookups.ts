// Round 128 — free tier's lifetime cap: 3 distinct receipt numbers total,
// ever, counting tracking and ad-hoc lookup together. Fixes two real gaps:
// (1) trackCase()'s old cap checked *currently tracked* rows, so untracking
// and re-tracking let a free account cycle through unlimited different
// receipts; (2) an ad-hoc `/dashboard?receipt=` lookup was never gated at
// all, tracked or not — a free account could look up any number of
// different cases as long as it never clicked "Track."
//
// Callers are responsible for only invoking these against a free-tier
// account (both real call sites — trackCase() in dashboard/actions.ts and
// the ad-hoc lookup in dashboard/page.tsx — already know the tier by the
// time they'd call this, so this module doesn't re-fetch it itself).

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { receiptLookups } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { TIER_LIMITS } from "@/lib/billing/tier";

async function getLifetimeReceipts(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ receiptNumber: receiptLookups.receiptNumber })
    .from(receiptLookups)
    .where(eq(receiptLookups.userId, userId));
  // Free-tier accounts never have more than TIER_LIMITS.free.maxCases rows
  // here — decrypt-and-compare in application code, same pattern trackCase()
  // already uses for its own "already tracking this receipt" check, rather
  // than a searchable-ciphertext column.
  return rows.map((r) => decryptField(r.receiptNumber));
}

export interface LifetimeLookupCheck {
  /** False only when this is a brand-new receipt and the lifetime cap is already used up. */
  allowed: boolean;
  /** Distinct receipts this account has ever touched, after this call. */
  lifetimeCount: number;
}

/**
 * Call before showing status for, or tracking, any receipt number on a
 * free-tier account. Records a new distinct receipt against the lifetime
 * cap; always allows (and never re-inserts) a receipt already in the
 * ledger, so re-viewing or re-tracking a case the account has already
 * touched never gets blocked.
 */
export async function checkAndRecordFreeLifetimeLookup(
  userId: string,
  receiptNumber: string
): Promise<LifetimeLookupCheck> {
  const seen = await getLifetimeReceipts(userId);
  if (seen.includes(receiptNumber)) {
    return { allowed: true, lifetimeCount: seen.length };
  }

  if (seen.length >= TIER_LIMITS.free.maxCases) {
    return { allowed: false, lifetimeCount: seen.length };
  }

  const db = getDb();
  await db.insert(receiptLookups).values({ userId, receiptNumber: encryptField(receiptNumber) });
  return { allowed: true, lifetimeCount: seen.length + 1 };
}

/** Read-only — for rendering a count (e.g. "2 of 3 lifetime lookups used") without touching the ledger. */
export async function getFreeLifetimeLookupCount(userId: string): Promise<number> {
  const seen = await getLifetimeReceipts(userId);
  return seen.length;
}
