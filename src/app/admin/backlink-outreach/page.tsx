import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingBacklinkOutreach } from "@/lib/db/schema";
import { PendingOutreachCard } from "./PendingOutreachCard";

export const dynamic = "force-dynamic";

// Round 84 — partner backlink outreach, draft-and-queue only. See
// pendingBacklinkOutreach's own comment in schema.ts and actions.ts's
// comment on approveOutreachDraft for why "approved" here still isn't
// "sent": the CAN-SPAM footer needs the LLC's real registered mailing
// address, still pending from Peter pulling it off the Northwest
// Registered Agent formation documents. This page and its two actions are
// the entire mechanism — nothing else in the codebase writes to or reads
// from pending_backlink_outreach's draftBody/status for sending purposes.
export default async function BacklinkOutreachAdminPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(pendingBacklinkOutreach)
    .where(eq(pendingBacklinkOutreach.status, "pending"))
    .orderBy(desc(pendingBacklinkOutreach.createdAt));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Backlink outreach — draft queue</h1>
      <p className="mb-2 mt-2 text-muted">
        Nothing here has been sent, and nothing here <em>can</em> be sent yet — there&apos;s no send capability
        wired up at all. &quot;Approve&quot; marks a draft ready for whenever sending is actually built, which is
        blocked on the LLC&apos;s registered mailing address for the CAN-SPAM footer.
      </p>
      <p className="mb-8 text-xs text-muted">
        Scoped to the attorney directory only — the other five Get Help entity types (legal aid, accredited
        representatives, DSOs, community orgs, pro bono representation) have no per-listing email address in the
        database at all.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          Nothing pending right now.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <PendingOutreachCard
              key={row.id}
              id={row.id}
              attorneyName={row.attorneyName}
              attorneyEmail={row.attorneyEmail}
              listingUrl={row.listingUrl}
              draftSubject={row.draftSubject}
              draftBody={row.draftBody}
            />
          ))}
        </div>
      )}
    </main>
  );
}
