"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingAliasActions, emailAliasConfigs } from "@/lib/db/schema";
import { sendAsAlias } from "@/lib/email-aliases/gmail-client";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }
  return session!.user.email!;
}

// Round 70 — the one function in this codebase that's allowed to send an
// alias-address email, and only from here, and only on this real click.
// Nothing upstream of this (the poller, the draft generator) can reach
// sendAsAlias directly.
export async function approvePendingAction(id: string, editedReply: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  const [row] = await db
    .select({
      id: pendingAliasActions.id,
      fromAddress: pendingAliasActions.fromAddress,
      subject: pendingAliasActions.subject,
      status: pendingAliasActions.status,
      alias: emailAliasConfigs.alias,
    })
    .from(pendingAliasActions)
    .innerJoin(emailAliasConfigs, eq(pendingAliasActions.aliasConfigId, emailAliasConfigs.id))
    .where(eq(pendingAliasActions.id, id));

  if (!row) throw new Error("Pending action not found.");
  if (row.status !== "pending") throw new Error(`Already ${row.status} — refusing to send twice.`);

  await sendAsAlias({
    fromAlias: row.alias,
    to: extractEmailAddress(row.fromAddress),
    subject: row.subject.toLowerCase().startsWith("re:") ? row.subject : `Re: ${row.subject}`,
    body: editedReply,
  });

  await db
    .update(pendingAliasActions)
    .set({ status: "sent", draftReply: editedReply, reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingAliasActions.id, id));

  revalidatePath("/admin/inbox");
}

export async function rejectPendingAction(id: string) {
  const adminEmail = await requireAdmin();
  const db = getDb();

  await db
    .update(pendingAliasActions)
    .set({ status: "rejected", reviewedAt: new Date(), reviewedBy: adminEmail })
    .where(eq(pendingAliasActions.id, id));

  revalidatePath("/admin/inbox");
}

/** From headers look like `Name <email@domain.com>` or a bare address — send-to needs just the address. */
function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return match ? match[1] : fromHeader.trim();
}
