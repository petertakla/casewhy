"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { setStatusChangeEmailsEnabled, setNewsSourceEnabled } from "@/lib/settings/settings";

async function requireUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("Sign in required.");
  }
  return session.user.id;
}

export async function updateStatusChangeEmails(enabled: boolean): Promise<void> {
  const userId = await requireUserId();
  await setStatusChangeEmailsEnabled(userId, enabled);
  revalidatePath("/settings");
}

export async function updateNewsSource(sourceId: string, enabled: boolean): Promise<void> {
  const userId = await requireUserId();
  await setNewsSourceEnabled(userId, sourceId, enabled);
  revalidatePath("/settings");
  revalidatePath("/news");
}
