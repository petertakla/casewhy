"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";

export async function trackCase(receiptNumber: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in to track a case.");
  }

  const db = getDb();
  const encryptedReceipt = encryptField(receiptNumber);
  const encryptedEmail = encryptField(session.user.email);
  await db
    .insert(trackedCases)
    .values({ userId: session.user.id, receiptNumber: encryptedReceipt, email: encryptedEmail })
    .onConflictDoUpdate({
      target: trackedCases.userId,
      // Switching to a different case resets the notification baseline —
      // otherwise the cron would compare the new case against the old
      // case's last-seen status and fire a spurious "change" email.
      set: {
        receiptNumber: encryptedReceipt,
        email: encryptedEmail,
        lastStatusText: null,
        lastCheckedAt: null,
      },
    });

  revalidatePath("/dashboard");
}

export async function getTrackedReceiptNumber(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ receiptNumber: trackedCases.receiptNumber })
    .from(trackedCases)
    .where(eq(trackedCases.userId, userId))
    .limit(1);
  if (!row) return null;
  try {
    return decryptField(row.receiptNumber);
  } catch {
    // Malformed/undecryptable row (e.g. pre-encryption test data) — treat
    // as no tracked case rather than crashing the dashboard.
    return null;
  }
}
