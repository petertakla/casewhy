import { CHANNEL_LABELS } from "@/lib/marketing/channel-labels";

// Round 98 item 7 — "Recent history" view, read-only cards. Deliberately
// a separate component, not MarketingQueueCard reused in a "readOnly"
// mode -- the task doc explicitly says to keep that card unchanged, and
// a posted/rejected item has nothing left to act on (no buttons, no
// editable draft box), so it's a genuinely different, simpler shape
// rather than the same component with half its UI hidden.

const STATUS_LABELS: Record<string, string> = {
  posted: "Posted",
  edited_posted: "Posted (edited)",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  posted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  edited_posted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-border-strong text-muted",
};

export function HistoryCard({
  channel,
  destination,
  draftText,
  status,
  postedUrl,
  reviewedAt,
  locale,
  mediaRefs,
}: {
  channel: string;
  destination: string;
  draftText: string | null;
  status: string;
  postedUrl: string | null;
  reviewedAt: Date | null;
  /** Round 90 — "en" | "es", shown as a chip. */
  locale?: string;
  /** Round 91 — the rendered Gemini/Veo asset, for pinterest/youtube/tiktok/instagram/facebook rows. */
  mediaRefs?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 opacity-80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {CHANNEL_LABELS[channel] ?? channel}
          {locale === "es" && (
            <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-brand-600 normal-case tracking-normal dark:text-brand-400">
              ES
            </span>
          )}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-border-strong text-muted"}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {destination.startsWith("http") || destination.startsWith("/") ? (
        <a href={destination} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-brand-600 hover:underline dark:text-brand-400">
          {destination}
        </a>
      ) : (
        // Round 91 — same fix as round 94's MarketingQueueCard: "new
        // post" (pinterest/youtube's own destination convention, no
        // reply target to link to) isn't a URL; a raw <a href> would be
        // broken. Plain text instead, same as that round's fix.
        <span className="mt-2 block font-mono text-xs text-muted">{destination}</span>
      )}

      {mediaRefs && (
        <div className="mt-3">
          {mediaRefs.endsWith(".mp4") ? (
            <video src={mediaRefs} controls className="max-h-64 rounded-lg border border-border-strong" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- a generated asset URL, not something next/image's optimizer has ever seen
            <img src={mediaRefs} alt="" className="max-h-64 rounded-lg border border-border-strong" />
          )}
        </div>
      )}

      {draftText && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">{draftText}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
        {reviewedAt && <span>{reviewedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
        {postedUrl && (
          <a href={postedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
            View posted URL ↗
          </a>
        )}
      </div>
    </div>
  );
}
