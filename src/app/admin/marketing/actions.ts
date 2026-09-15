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

export type ApproveAutoPostResult = { ok: true } | { ok: false; error: string };

// auto_post channels: same round-70 enforcement shape (approve is the
// only code path that could ever call a post/publish API). Real
// behavior now, not just a stub: looks up the channel's registered
// poster (src/lib/marketing/posters/registry.ts). If one exists, this IS
// the one and only place it's ever invoked, and only on this explicit
// click -- on success the item moves straight to "posted" with the real
// URL. If no poster is registered for this channel yet, the item just
// moves to "approved" and stops -- the card's own rendering (not this
// action) is what falls back to manual-post framing in that case.
//
// Round 90 finding, twice over: (1) a poster failure used to leave the
// row at "approved," which isn't in NEEDS_ACTION_STATUSES (pending,
// escalated) or HISTORY_STATUSES (posted, edited_posted, rejected) on the
// queue page -- the row became genuinely invisible, a bug that sat
// dormant since round 89 because no real poster existed to ever throw
// until this round's X/Threads posters did. Fixed by reverting to
// "pending" (reviewedAt/reviewedBy cleared) on failure. (2) this function
// used to *throw* the poster's error -- which this exact codebase already
// has a standing lesson about (round 107, CLOUD_CLAUDE.md): a Server
// Action's thrown Error message is redacted from the client in Next.js
// production builds by default, so what Peter actually saw in production
// was a generic "error occurred in Server Components render," not the
// real "X posting isn't configured yet" message the poster threw. Fixed
// the same way round 107 fixed it: return { ok, error } as data instead
// of throwing.
export async function approveForAutoPost(id: string, finalText: string, channel: string): Promise<ApproveAutoPostResult> {
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
      await db
        .update(marketingQueue)
        .set({ status: "pending", reviewedAt: null, reviewedBy: null })
        .where(eq(marketingQueue.id, id));
      revalidatePath("/admin/marketing");
      revalidatePath("/admin/marketing/log");
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/log");
  return { ok: true };
}
