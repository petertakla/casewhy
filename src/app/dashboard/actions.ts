"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";
import { getSubscriptionTier, TIER_LIMITS } from "@/lib/billing/tier";

export interface TrackedCase {
  id: string;
  receiptNumber: string;
}

export async function getTrackedCases(userId: string): Promise<TrackedCase[]> {
  const db = getDb();
  const rows = await db
    .select({ id: trackedCases.id, receiptNumber: trackedCases.receiptNumber })
    .from(trackedCases)
    .where(eq(trackedCases.userId, userId))
    .orderBy(trackedCases.createdAt);

  const result: TrackedCase[] = [];
  for (const row of rows) {
    try {
      result.push({ id: row.id, receiptNumber: decryptField(row.receiptNumber) });
    } catch {
      // Malformed/undecryptable row (e.g. pre-encryption test data) — skip
      // rather than crash the dashboard.
    }
  }
  return result;
}

/**
 * Track a case, subject to the account's plan cap (CW-36: free = 1, plus =
 * 5 — see src/lib/billing/tier.ts). Each tracked case is now its own row
 * (CW-36 removed the old one-row-per-account constraint) — adding a case
 * no longer replaces an existing one; call untrackCase() first if the cap
 * is already reached.
 */
export async function trackCase(receiptNumber: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in to track a case.");
  }

  const existing = await getTrackedCases(session.user.id);
  if (existing.some((c) => c.receiptNumber === receiptNumber)) {
    return; // already tracking this exact case
  }

  const tier = await getSubscriptionTier(session.user.id);
  const maxCases = TIER_LIMITS[tier].maxCases;
  if (existing.length >= maxCases) {
    // A plain Error, not a custom class — "use server" files may only
    // export async functions, so a thrown error class can't live here.
    throw new Error(
      `You're tracking the maximum of ${maxCases} case${maxCases === 1 ? "" : "s"} on your current plan.`
    );
  }

  const db = getDb();
  await db.insert(trackedCases).values({
    userId: session.user.id,
    receiptNumber: encryptField(receiptNumber),
    email: encryptField(session.user.email),
  });

  revalidatePath("/dashboard");
  revalidatePath("/ask");
}

export async function untrackCase(id: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in required.");
  }

  const db = getDb();
  await db
    .delete(trackedCases)
    .where(and(eq(trackedCases.id, id), eq(trackedCases.userId, session.user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/ask");
}
