"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { communitySourceConfigs } from "@/lib/db/schema";
import { setDailyDraftCap, setSpanishSocialEnabled, setGeminiVideoMonthlyCap, setSocialPostingEnabled } from "@/lib/marketing/config";
import { flushApprovedQueueItems } from "../actions";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
}

// Round 98 — "subreddit list" specifically (the task doc's own wording),
// scoped to channel: "reddit" since that's the only source type
// community_source_configs currently holds any real rows for (the other
// community channel, immigration.com's RSS feed, isn't config-table-driven
// at all -- see poll-marketing-sources/route.ts, which hardcodes that URL).
export async function addSubreddit(name: string) {
  await requireAdmin();
  const trimmed = name.trim().replace(/^r\//i, "");
  if (!trimmed) return;

  const db = getDb();
  await db
    .insert(communitySourceConfigs)
    .values({ channel: "reddit", sourceIdentifier: trimmed, label: `r/${trimmed}`, enabled: true });
  revalidatePath("/admin/marketing/settings");
}

export async function toggleSubredditEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  const db = getDb();
  await db.update(communitySourceConfigs).set({ enabled }).where(eq(communitySourceConfigs.id, id));
  revalidatePath("/admin/marketing/settings");
}

export async function removeSubreddit(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(communitySourceConfigs).where(eq(communitySourceConfigs.id, id));
  revalidatePath("/admin/marketing/settings");
}

export async function updateDailyCap(cap: number) {
  await requireAdmin();
  if (!Number.isInteger(cap) || cap < 1 || cap > 100) return;
  await setDailyDraftCap(cap);
  revalidatePath("/admin/marketing/settings");
}

// Round 90 — Peter's own switch for the round 90 task doc's Section 4
// English-first sequencing. Toggling this on is the ONLY thing that makes
// poll-policy-news start drafting Spanish variants -- see that route's
// own comment.
export async function toggleSpanishSocial(enabled: boolean) {
  await requireAdmin();
  await setSpanishSocialEnabled(enabled);
  revalidatePath("/admin/marketing/settings");
}

// Round 91 — budget guard for /api/cron/render-content-briefs' Veo video
// generation. Same shape as updateDailyCap above.
export async function updateGeminiVideoCap(cap: number) {
  await requireAdmin();
  if (!Number.isInteger(cap) || cap < 0 || cap > 100) return;
  await setGeminiVideoMonthlyCap(cap);
  revalidatePath("/admin/marketing/settings");
}

// Round 90 prep follow-up (Sep 18) — the master switch. Turning it on
// also flushes every row a prior approval left sitting at "approved"
// (flushApprovedQueueItems), so Peter's first approvals actually go out
// the moment he flips this rather than needing a second click each.
export async function toggleSocialPosting(enabled: boolean): Promise<{ posted: number; failed: number } | null> {
  await requireAdmin();
  await setSocialPostingEnabled(enabled);
  revalidatePath("/admin/marketing/settings");
  if (!enabled) return null;
  return flushApprovedQueueItems();
}
