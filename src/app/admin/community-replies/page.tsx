import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { pendingCommunityReplies } from "@/lib/db/schema";
import { PendingCommunityReplyCard } from "./PendingCommunityReplyCard";

export const dynamic = "force-dynamic";

// Round 85 — community-forum monitoring, draft-and-queue only. See
// pendingCommunityReplies' own comment in schema.ts and actions.ts's
// comment on approveReply for why "approved" here means "ready for Peter
// to copy and paste himself," never "posted" — there is no Reddit/forum
// posting capability anywhere in this codebase, deliberately, per
// SOCIAL_MEDIA_GUARDRAILS.md Section 0.
export default async function CommunityRepliesAdminPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(pendingCommunityReplies)
    .where(eq(pendingCommunityReplies.status, "pending"))
    .orderBy(desc(pendingCommunityReplies.createdAt));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Community replies — draft queue</h1>
      <p className="mb-2 mt-2 text-muted">
        Nothing here has been posted anywhere, and nothing here <em>can</em> be posted automatically — there&apos;s
        no Reddit/forum posting capability at all, by design. &quot;Approved&quot; just marks a draft&apos;s final
        text ready for you to copy and paste yourself, from your own logged-in browser session, at your own timing.
      </p>
      <p className="mb-8 text-xs text-muted">
        Amber-highlighted cards were flagged by the classifier instead of drafted — a legal-advice request, hostile
        or bad-faith tone, existing moderator pushback, a crisis/self-harm signal, an EO 14161 vetting-rule question,
        or the first post ever in a new community. Read the flag reason yourself before deciding what to do, if
        anything.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          Nothing pending right now.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <PendingCommunityReplyCard
              key={row.id}
              id={row.id}
              source={row.source}
              sourceName={row.sourceName}
              threadUrl={row.threadUrl}
              threadTitle={row.threadTitle}
              threadExcerpt={row.threadExcerpt}
              relevanceReason={row.relevanceReason}
              draftReply={row.draftReply}
              escalationReason={row.escalationReason}
              sourceCitation={row.sourceCitation}
              selfPromoNote={row.selfPromoNote}
            />
          ))}
        </div>
      )}
    </main>
  );
}
