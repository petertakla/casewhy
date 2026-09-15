import { redirect } from "next/navigation";
import { inArray, desc, gte, and } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { marketingQueue } from "@/lib/db/schema";
import { getUpdateBySlugFromDisk } from "@/lib/updates/updates";
import { CHANNEL_LABELS, CHANNEL_ORDER } from "@/lib/marketing/channel-labels";
import { MarketingQueueCard } from "./MarketingQueueCard";
import { HistoryCard } from "./HistoryCard";

export const dynamic = "force-dynamic";

// Round 73 (real) — generalized marketing approval queue, replacing round
// 85's narrower /admin/community-replies (see schema.ts's own comment on
// marketingQueue for the full "why generalize" reasoning). manual_post
// items (every community/forum channel, per SOCIAL_MEDIA_GUARDRAILS.md
// Section 0) never post automatically -- Peter marks them posted himself
// after copying the text. auto_post items (owned channels only) need a
// real approval click before any future poster integration could touch
// them, same enforcement shape as round 70's pendingAliasActions.
//
// Round 98 item 7 — grouped by channel (registry order), a channel
// filter, and a Needs action / Recent history toggle, both in the URL
// query so a view is linkable/bookmarkable. The card component itself
// (MarketingQueueCard) is untouched, per the task doc's own instruction
// -- history rows use a separate, simpler read-only HistoryCard instead.

const NEEDS_ACTION_STATUSES = ["pending", "escalated"] as const;
const HISTORY_STATUSES = ["posted", "edited_posted", "rejected"] as const;
const HISTORY_WINDOW_DAYS = 30;

function buildHref(channel: string | undefined, view: "needs-action" | "history"): string {
  const params = new URLSearchParams();
  if (channel) params.set("channel", channel);
  if (view === "history") params.set("view", "history");
  const qs = params.toString();
  return qs ? `/admin/marketing?${qs}` : "/admin/marketing";
}

function summarize(rows: { status: string }[]): string {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return Object.entries(counts)
    .map(([status, n]) => `${n} ${status}`)
    .join(" · ");
}

export default async function MarketingQueueAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; view?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const { channel: channelParam, view: viewParam } = await searchParams;
  const view: "needs-action" | "history" = viewParam === "history" ? "history" : "needs-action";

  const db = getDb();
  const rows =
    view === "history"
      ? await db
          .select()
          .from(marketingQueue)
          .where(
            and(
              inArray(marketingQueue.status, HISTORY_STATUSES),
              gte(marketingQueue.reviewedAt, new Date(Date.now() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000))
            )
          )
          .orderBy(desc(marketingQueue.reviewedAt))
      : await db
          .select()
          .from(marketingQueue)
          .where(inArray(marketingQueue.status, NEEDS_ACTION_STATUSES))
          .orderBy(desc(marketingQueue.createdAt));

  // Chips only for channels that actually have something in this view --
  // showing all 16 when only 2 have items is noise, not a filter aid.
  const availableChannels = CHANNEL_ORDER.filter((c) => rows.some((r) => r.channel === c));
  const filteredRows = channelParam ? rows.filter((r) => r.channel === channelParam) : rows;

  const groups = CHANNEL_ORDER.map((channel) => {
    const channelRows = filteredRows.filter((r) => r.channel === channel);
    if (view === "needs-action") {
      // Escalated pinned to the top of its own section -- createdAt desc
      // order is already applied within each status by the query above.
      channelRows.sort((a, b) => (a.status === "escalated" ? -1 : 0) - (b.status === "escalated" ? -1 : 0));
    }
    return { channel, rows: channelRows };
  }).filter((g) => g.rows.length > 0);

  // Round 107 — the Blog card used to derive its title/summary from the
  // seed draftText (`${title}\n\n${summary}`, round 103's own format),
  // which drifts the moment an admin edits the post -- the card, the
  // preview, and the editor would disagree. Read the merged post (repo
  // file + DB override, same function the preview route and editor use)
  // for every blog row instead, once here rather than per-render.
  const blogSlugs = filteredRows.filter((r) => r.channel === "blog").map((r) => r.destination.replace(/^\/updates\//, ""));
  const blogPostEntries = await Promise.all(blogSlugs.map(async (slug) => [slug, await getUpdateBySlugFromDisk(slug)] as const));
  const blogPostBySlug = new Map(blogPostEntries);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Marketing queue</h1>
      <p className="mb-2 mt-2 text-muted">
        Community/forum channels never post automatically — you copy the text and post it yourself, then mark it
        here. Blog, X, and Threads can auto-post (a real approval click actually posts) — X/Threads need their API
        credentials set first (see the round 90 checklist in CLOUD_CLAUDE.md) or the click will surface a clear
        error instead of posting. Every other owned channel still auto-posts only once a future round wires up
        that platform&apos;s API.
      </p>
      <p className="mb-6 text-xs text-muted">
        Amber-highlighted cards were flagged by the classifier instead of drafted — a legal-advice request, hostile
        or bad-faith tone, existing moderator pushback, a crisis/self-harm signal, an EO 14161 vetting-rule question,
        or the first post ever in a new community. Read the flag reason yourself before deciding what to do.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 text-sm">
          <Link
            href={buildHref(channelParam, "needs-action")}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
              view === "needs-action" ? "bg-brand-500 text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Needs action
          </Link>
          <Link
            href={buildHref(channelParam, "history")}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
              view === "history" ? "bg-brand-500 text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Recent history
          </Link>
        </div>
      </div>

      {availableChannels.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={buildHref(undefined, view)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              !channelParam ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400" : "border-border text-muted hover:border-border-strong"
            }`}
          >
            All
          </Link>
          {availableChannels.map((channel) => (
            <Link
              key={channel}
              href={buildHref(channel, view)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                channelParam === channel
                  ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : "border-border text-muted hover:border-border-strong"
              }`}
            >
              {CHANNEL_LABELS[channel] ?? channel}
            </Link>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
          {view === "history" ? "Nothing posted, edited, or rejected in the last 30 days." : "Nothing pending right now."}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ channel, rows: channelRows }) => (
            <div key={channel}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
                {CHANNEL_LABELS[channel] ?? channel} · {summarize(channelRows)}
              </h2>
              <div className="space-y-5">
                {channelRows.map((row) =>
                  view === "history" ? (
                    <HistoryCard
                      key={row.id}
                      channel={row.channel}
                      destination={row.destination}
                      draftText={row.draftText}
                      status={row.status}
                      postedUrl={row.postedUrl}
                      reviewedAt={row.reviewedAt}
                      locale={row.locale}
                    />
                  ) : (
                    <MarketingQueueCard
                      key={row.id}
                      id={row.id}
                      channel={row.channel}
                      mode={row.mode}
                      destination={row.destination}
                      draftText={row.draftText}
                      sourceCitations={row.sourceCitations}
                      guardrailNotes={row.guardrailNotes}
                      locale={row.locale}
                      blogPost={
                        row.channel === "blog"
                          ? blogPostBySlug.get(row.destination.replace(/^\/updates\//, "")) ?? null
                          : undefined
                      }
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
