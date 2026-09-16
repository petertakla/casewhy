"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { opsTasks } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
}

export async function markOpsTaskDone(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.update(opsTasks).set({ status: "done", completedAt: new Date() }).where(eq(opsTasks.id, id));
  revalidatePath("/admin/ops-tasks");
}

export async function dismissOpsTask(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.update(opsTasks).set({ status: "dismissed", completedAt: new Date() }).where(eq(opsTasks.id, id));
  revalidatePath("/admin/ops-tasks");
}
