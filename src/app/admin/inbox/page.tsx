import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingAliasActions, emailAliasConfigs } from "@/lib/db/schema";
import { PendingActionCard } from "./PendingActionCard";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: pendingAliasActions.id,
      fromAddress: pendingAliasActions.fromAddress,
      subject: pendingAliasActions.subject,
      receivedAt: pendingAliasActions.receivedAt,
      summary: pendingAliasActions.summary,
      draftReply: pendingAliasActions.draftReply,
      proposedAction: pendingAliasActions.proposedAction,
      urgent: pendingAliasActions.urgent,
      alias: emailAliasConfigs.alias,
      purpose: emailAliasConfigs.purpose,
    })
    .from(pendingAliasActions)
    .innerJoin(emailAliasConfigs, eq(pendingAliasActions.aliasConfigId, emailAliasConfigs.id))
    .where(eq(pendingAliasActions.status, "pending"))
    .orderBy(desc(pendingAliasActions.urgent), desc(pendingAliasActions.receivedAt));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Alias inbox — pending approval</h1>
      <p className="mb-8 mt-2 text-muted">
        Nothing here has been sent. Review, edit if needed, then approve or reject each one.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          Nothing pending right now.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <PendingActionCard key={row.id} {...row} />
          ))}
        </div>
      )}
    </main>
  );
}
