import { redirect } from "next/navigation";
import { inArray, desc } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { MarketingQueueCard } from "./MarketingQueueCard";

export const dynamic = "force-dynamic";

// Round 73 (real) — generalized marketing approval queue, replacing round
// 85's narrower /admin/community-replies (see schema.ts's own comment on
// marketingQueue for the full "why generalize" reasoning). manual_post
// items (every community/forum channel, per SOCIAL_MEDIA_GUARDRAILS.md
// Section 0) never post automatically -- Peter marks them posted himself
// after copying the text. auto_post items (owned channels only) need a
// real approval click before any future poster integration could touch
// them, same enforcement shape as round 70's pendingAliasActions.
export default async function MarketingQueueAdminPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(marketingQueue)
    .where(inArray(marketingQueue.status, ["pending", "escalated"]))
    .orderBy(desc(marketingQueue.createdAt));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Marketing queue</h1>
        <div className="flex gap-4">
          <Link href="/admin/marketing/attribution" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            Attribution →
          </Link>
          <Link href="/admin/marketing/log" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            View log →
          </Link>
        </div>
      </div>
      <p className="mb-2 mt-2 text-muted">
        Community/forum channels never post automatically — you copy the text and post it yourself, then mark it
        here. Owned channels can auto-post once a future round wires up that platform&apos;s API, but only after a
        real approval click on that specific item.
      </p>
      <p className="mb-8 text-xs text-muted">
        Amber-highlighted cards were flagged by the classifier instead of drafted — a legal-advice request, hostile
        or bad-faith tone, existing moderator pushback, a crisis/self-harm signal, an EO 14161 vetting-rule question,
        or the first post ever in a new community. Read the flag reason yourself before deciding what to do.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          Nothing pending right now.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <MarketingQueueCard
              key={row.id}
              id={row.id}
              channel={row.channel}
              mode={row.mode}
              destination={row.destination}
              draftText={row.draftText}
              sourceCitations={row.sourceCitations}
              guardrailNotes={row.guardrailNotes}
            />
          ))}
        </div>
      )}
    </main>
  );
}
