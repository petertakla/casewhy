"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingCommunityReplies } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

// Round 85 — same hard boundary as approveOutreachDraft (round 84) and for
// the same underlying reason (no send/post capability exists, deliberately
// — see SOCIAL_MEDIA_GUARDRAILS.md Section 0). "Approved" means "reviewed,
// final text ready for Peter to copy and paste into the real thread
// himself" — nothing in this file or anywhere else in the codebase posts
// to Reddit or any forum.
export async function approveReply(id: string, editedBody: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  await db
    .update(pendingCommunityReplies)
    .set({ status: "approved", draftReply: editedBody, reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingCommunityReplies.id, id));

  revalidatePath("/admin/community-replies");
}

export async function rejectReply(id: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  await db
    .update(pendingCommunityReplies)
    .set({ status: "rejected", reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingCommunityReplies.id, id));

  revalidatePath("/admin/community-replies");
}
