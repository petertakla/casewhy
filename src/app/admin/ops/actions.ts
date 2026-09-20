"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { emailAliasConfigs, socialChannelConfigs } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
}

// Round 70's original rule (CLOUD_CLAUDE.md): security@/legal@ carry
// round-70's own 5-minute/urgent-alert cadence, deliberately never
// relaxed -- these are the two aliases where a slow response is a real
// liability (security disclosures, legal notices). Round 119 makes this
// a real server-side floor, not just a UI hint: the two locked aliases
// silently clamp to the same values already live for them today,
// whatever the client sends. Every other alias is freely editable.
const LOCKED_ALIASES: Record<string, { pollIntervalMinutes: number; actionLevel: "draft_and_flag_urgent" }> = {
  security: { pollIntervalMinutes: 5, actionLevel: "draft_and_flag_urgent" },
  legal: { pollIntervalMinutes: 5, actionLevel: "draft_and_flag_urgent" },
};

export async function updateAliasConfig(
  id: string,
  alias: string,
  updates: { pollIntervalMinutes: number; actionLevel: "draft_only" | "draft_and_flag_urgent"; enabled: boolean; notes: string | null }
) {
  await requireAdmin();
  const db = getDb();
  const locked = LOCKED_ALIASES[alias];
  const values = locked ? { ...updates, ...locked } : updates;
  await db
    .update(emailAliasConfigs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(emailAliasConfigs.id, id));
  revalidatePath("/admin/ops");
}

export async function updateSocialChannelConfig(
  id: string,
  updates: { minIntervalMinutes: number; mode: "manual_post" | "auto_post"; enabled: boolean; notes: string | null }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(socialChannelConfigs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(socialChannelConfigs.id, id));
  revalidatePath("/admin/ops");
}

export async function addSocialChannelConfig(channel: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .insert(socialChannelConfigs)
    .values({ channel: channel as (typeof socialChannelConfigs.$inferInsert)["channel"] })
    .onConflictDoNothing({ target: socialChannelConfigs.channel });
  revalidatePath("/admin/ops");
}
