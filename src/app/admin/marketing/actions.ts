"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

// Round 73 (real) — manual_post channels (every community/forum channel,
// per SOCIAL_MEDIA_GUARDRAILS.md Section 0) skip a separate "approve"
// step: there's nothing for code to do between review and Peter actually
// posting it himself, so the queue goes straight from pending to one of
// posted/edited_posted/rejected.
export async function markPosted(id: string, finalText: string, edited: boolean) {
  const adminEmail = await requireAdmin();
  const db = getDb();
  await db
    .update(marketingQueue)
    .set({
      status: edited ? "edited_posted" : "posted",
      draftText: finalText,
      postedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: adminEmail,
    })
    .where(eq(marketingQueue.id, id));
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/log");
}

export async function rejectItem(id: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();
  await db
    .update(marketingQueue)
    .set({ status: "rejected", reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(marketingQueue.id, id));
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/log");
}

// auto_post channels: same round-70 enforcement shape (approve is the
// only code path that could ever call a post/publish API) -- but no
// channel has an actual poster integration wired up yet (rounds 74-76
// register theirs here), so this currently only ever reaches "approved"
// and stops; there is deliberately no call to any posting API in this
// function yet.
export async function approveForAutoPost(id: string, finalText: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();
  await db
    .update(marketingQueue)
    .set({ status: "approved", draftText: finalText, reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(marketingQueue.id, id));
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/log");
}
