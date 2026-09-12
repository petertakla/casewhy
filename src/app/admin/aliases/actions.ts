"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { emailAliasConfigs } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
}

export async function updateAliasConfig(
  id: string,
  updates: { pollIntervalMinutes: number; actionLevel: "draft_only" | "draft_and_flag_urgent"; enabled: boolean }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(emailAliasConfigs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(emailAliasConfigs.id, id));
  revalidatePath("/admin/aliases");
}
