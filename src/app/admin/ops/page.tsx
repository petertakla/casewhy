import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { emailAliasConfigs, pendingAliasActions, socialChannelConfigs } from "@/lib/db/schema";
import { AliasConfigRow } from "./AliasConfigRow";
import { SocialChannelConfigRow } from "./SocialChannelConfigRow";
import { AddChannelForm } from "./AddChannelForm";

export const dynamic = "force-dynamic";

// Round 70's original rule, never relaxed -- see actions.ts's own comment.
const LOCKED_ALIASES = new Set(["security", "legal"]);

// Round 119 — the full pool of channels this ops table can ever offer
// via "add channel." blog/email/outreach are excluded: blog is CaseWhy's
// own CMS-like content lane (round 93), not a social channel; email is
// the round 70 alias-monitoring system covered by the other table;
// outreach is an internal reminder bucket (round 90's Visa Bulletin
// refresh flag), never a real post.
const ADDABLE_CHANNEL_POOL = [
  "x",
  "threads",
  "facebook",
  "instagram",
  "pinterest",
  "youtube",
  "tiktok",
  "linkedin",
  "reddit",
  "quora",
  "visajourney",
  "trackitt",
  "immigration_com",
];

export default async function AdminOpsPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();

  const [aliasConfigs, pendingCounts, channelConfigs] = await Promise.all([
    db.select().from(emailAliasConfigs).orderBy(asc(emailAliasConfigs.alias)),
    db
      .select({ aliasConfigId: pendingAliasActions.aliasConfigId, n: sql<number>`count(*)::int` })
      .from(pendingAliasActions)
      .where(eq(pendingAliasActions.status, "pending"))
      .groupBy(pendingAliasActions.aliasConfigId),
    db.select().from(socialChannelConfigs).orderBy(asc(socialChannelConfigs.channel)),
  ]);

  const pendingByConfigId = new Map(pendingCounts.map((r) => [r.aliasConfigId, r.n]));
  const configuredChannels = new Set(channelConfigs.map((c) => c.channel));
  const addable = ADDABLE_CHANNEL_POOL.filter((c) => !configuredChannels.has(c as (typeof socialChannelConfigs.$inferSelect)["channel"]));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Ops console</h1>
      <p className="mb-8 mt-2 text-muted">
        Per-alias and per-channel monitoring cadence, review mode, and start/stop — edits apply on the next poll, no
        code change needed.
      </p>

      <section>
        <h2 className="text-lg font-semibold">Email aliases</h2>
        <p className="mt-1 text-sm text-muted">
          security@ and legal@ are locked to a 5-minute poll and an urgent alert on every message (round 70&rsquo;s
          original rule) — not editable here or via the API.
        </p>
        <div className="mt-3 space-y-3">
          {aliasConfigs.map((config) => (
            <AliasConfigRow
              key={config.id}
              {...config}
              pendingCount={pendingByConfigId.get(config.id) ?? 0}
              locked={LOCKED_ALIASES.has(config.alias)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Social channels</h2>
        <p className="mt-1 text-sm text-muted">
          Facebook&rsquo;s mode isn&rsquo;t editable here — the owned Page auto-posts, Groups always stage for review, per
          SOCIAL_MEDIA_GUARDRAILS.md Section 0.
        </p>
        <div className="mt-3 space-y-3">
          {channelConfigs.map((config) => (
            <SocialChannelConfigRow key={config.id} {...config} />
          ))}
        </div>
        <AddChannelForm addable={addable} />
      </section>
    </div>
  );
}
