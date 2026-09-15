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
// "sent": there's no send capability wired up at all yet (which Postmark
// stream/from-address to use, and when to actually authorize sending, is
// still an open decision) — not a CAN-SPAM blocker. The LLC's registered
// mailing address (round 67, Sep 10) is already in the draft footer
// (see generate-backlink-outreach-drafts.ts). This page and its two
// actions are the entire mechanism — nothing else in the codebase writes
// to or reads from pending_backlink_outreach's draftBody/status for
// sending purposes.
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
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Backlink outreach — draft queue</h1>
      <p className="mb-2 mt-2 text-muted">
        Nothing here has been sent, and nothing here <em>can</em> be sent yet — there&apos;s no send capability
        wired up at all. &quot;Approve&quot; marks a draft ready for whenever sending is actually built. The
        CAN-SPAM mailing-address requirement is already covered (the LLC&apos;s registered address is in the
        footer of every draft) — sending is just genuinely not built yet.
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
    </div>
  );
}
