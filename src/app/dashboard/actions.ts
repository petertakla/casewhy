"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { trackedCases } from "@/lib/db/schema";

export async function trackCase(receiptNumber: string): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in to track a case.");
  }

  const db = getDb();
  await db
    .insert(trackedCases)
    .values({ userId: session.user.id, receiptNumber })
    .onConflictDoUpdate({
      target: trackedCases.userId,
      set: { receiptNumber },
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
  return row?.receiptNumber ?? null;
}
