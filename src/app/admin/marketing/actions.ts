"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { getPosterForChannel } from "@/lib/marketing/posters/registry";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

// Round 89 (built under the working label "round 73") — manual_post
// channels (every community/forum channel, per
// SOCIAL_MEDIA_GUARDRAILS.md Section 0) skip a separate "approve" step:
// there's nothing for code to do between review and Peter actually
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
// only code path that could ever call a post/publish API). Real
// behavior now, not just a stub: looks up the channel's registered
// poster (src/lib/marketing/posters/registry.ts). If one exists, this IS
// the one and only place it's ever invoked, and only on this explicit
// click -- on success the item moves straight to "posted" with the real
// URL; on failure it stays "approved" with the error surfaced so Peter
// can retry or fall back to manual. If no poster is registered for this
// channel yet (every real channel, as of this round -- rounds 90-92
// register theirs), the item just moves to "approved" and stops, same
// as before -- the card's own rendering (not this action) is what falls
// back to manual-post framing in that case.
export async function approveForAutoPost(id: string, finalText: string, channel: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  const [updated] = await db
    .update(marketingQueue)
    .set({ status: "approved", draftText: finalText, reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(marketingQueue.id, id))
    .returning({ destination: marketingQueue.destination, mediaRefs: marketingQueue.mediaRefs });

  const poster = getPosterForChannel(channel);
  if (poster) {
    try {
      const result = await poster({
        channel,
        draftText: finalText,
        mediaRefs: updated.mediaRefs,
        destination: updated.destination,
      });
      await db
        .update(marketingQueue)
        .set({ status: "posted", postedAt: new Date(), postedUrl: result.url })
        .where(eq(marketingQueue.id, id));
    } catch (err) {
      // Stays "approved" -- Peter can see it didn't post and retry or
      // handle manually. Not silently swallowed: the caller gets the error.
      revalidatePath("/admin/marketing");
      revalidatePath("/admin/marketing/log");
      throw err;
    }
  }

  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/log");
}
