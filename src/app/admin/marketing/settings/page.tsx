import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { communitySourceConfigs } from "@/lib/db/schema";
import { getDailyDraftCap, getSpanishSocialEnabled, getGeminiVideoMonthlyCap } from "@/lib/marketing/config";
import { getMonthlyXWriteCount, X_FREE_TIER_MONTHLY_WRITE_LIMIT } from "@/lib/marketing/posters/x-rate-limit";
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
  const [subreddits, dailyCap, spanishSocialEnabled, geminiVideoCap, xWriteCount] = await Promise.all([
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
    getSpanishSocialEnabled(),
    getGeminiVideoMonthlyCap(),
    getMonthlyXWriteCount(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Marketing settings</h1>
      <p className="mb-2 mt-2 text-muted">
        The subreddit reference list and the daily draft cap, live-editable. Guardrails and channel-specific rules
        are still a document, not a setting — see <code>SOCIAL_MEDIA_GUARDRAILS.md</code>.
      </p>
      <p className="mb-8 text-sm text-muted">
        X free-tier writes this calendar month:{" "}
        <strong className={xWriteCount >= X_FREE_TIER_MONTHLY_WRITE_LIMIT * 0.9 ? "text-red-500" : "text-foreground"}>
          {xWriteCount} / {X_FREE_TIER_MONTHLY_WRITE_LIMIT}
        </strong>{" "}
        (each tweet in a thread counts separately; posting refuses once this would go over).
      </p>
      <MarketingSettingsForm
        subreddits={subreddits}
        dailyCap={dailyCap}
        spanishSocialEnabled={spanishSocialEnabled}
        geminiVideoCap={geminiVideoCap}
      />
    </div>
  );
}
