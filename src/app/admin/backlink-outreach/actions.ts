"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingBacklinkOutreach } from "@/lib/db/schema";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

// Round 84 — deliberately does NOT send anything. "Approved" here means
// "reviewed and ready whenever a real send capability exists" — the task
// doc's own explicit boundary (real blocker: the LLC's registered mailing
// address, required for the CAN-SPAM footer, still pending). There is no
// approve-and-send path in this file at all, unlike admin/inbox/actions.ts's
// approvePendingAction — that's intentional, not an oversight.
export async function approveOutreachDraft(id: string, editedBody: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  await db
    .update(pendingBacklinkOutreach)
    .set({ status: "approved", draftBody: editedBody, reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingBacklinkOutreach.id, id));

  revalidatePath("/admin/backlink-outreach");
}

export async function rejectOutreachDraft(id: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  await db
    .update(pendingBacklinkOutreach)
    .set({ status: "rejected", reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingBacklinkOutreach.id, id));

  revalidatePath("/admin/backlink-outreach");
}
