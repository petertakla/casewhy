import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { communitySourceConfigs } from "@/lib/db/schema";
import { getDailyDraftCap } from "@/lib/marketing/config";
import { MarketingSettingsForm } from "./MarketingSettingsForm";

export const dynamic = "force-dynamic";

// Round 98 item 4 — the config page round 89's own task doc asked for
// but never got built: the subreddit list has been a real, editable DB
// table (community_source_configs) since round 89, with no admin UI to
// actually view or change it; the daily cap was a hardcoded source
// constant until this same round moved it into marketingSettings (see
// schema.ts's comment on that table).
export default async function MarketingSettingsPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const db = getDb();
  const [subreddits, dailyCap] = await Promise.all([
    db
      .select({
        id: communitySourceConfigs.id,
        sourceIdentifier: communitySourceConfigs.sourceIdentifier,
        label: communitySourceConfigs.label,
        enabled: communitySourceConfigs.enabled,
      })
      .from(communitySourceConfigs)
      .orderBy(asc(communitySourceConfigs.label)),
    getDailyDraftCap(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Marketing settings</h1>
      <p className="mb-8 mt-2 text-muted">
        The subreddit list and the daily draft cap, live-editable. Guardrails and channel-specific rules are still a
        document, not a setting — see <code>SOCIAL_MEDIA_GUARDRAILS.md</code>.
      </p>
      <MarketingSettingsForm subreddits={subreddits} dailyCap={dailyCap} />
    </div>
  );
}
