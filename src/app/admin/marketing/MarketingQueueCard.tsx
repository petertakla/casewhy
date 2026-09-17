"use client";

import { useState } from "react";
import { PendingButton } from "@/components/PendingButton";
import { markPosted, rejectItem, approveForAutoPost } from "./actions";
import { REGISTERED_POSTER_CHANNELS } from "@/lib/marketing/posters/registered-channels";
import { CHANNEL_LABELS } from "@/lib/marketing/channel-labels";
import type { UpdatePost } from "@/lib/updates/updates";

const MEDIA_CHANNELS = new Set(["pinterest", "youtube", "tiktok", "instagram", "facebook"]);

export function MarketingQueueCard({
  id,
  channel,
  mode,
  destination,
  draftText,
  sourceCitations,
  guardrailNotes,
  locale,
  blogPost,
  mediaRefs,
}: {
  id: string;
  channel: string;
  mode: "manual_post" | "auto_post";
  destination: string;
  draftText: string | null;
  sourceCitations: string | null;
  guardrailNotes: string | null;
  /** Round 90 — "en" | "es". Only ever "es" once marketingSettings.spanishSocialEnabled is on; shown as a chip next to the channel label. */
  locale?: string;
  /** Round 107 — the merged post (repo file + any DB override) for blog rows, fetched by the parent page. undefined for non-blog channels; null if somehow no matching post exists on disk. */
  blogPost?: UpdatePost | null;
  /** Round 91 — the rendered Gemini/Veo asset URL for pinterest/youtube/tiktok/instagram/facebook rows. Null for every other channel. */
  mediaRefs?: string | null;
}) {
  const [text, setText] = useState(draftText ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const isEscalationOnly = !draftText;
  const isBlog = channel === "blog";
  const blogSlug = destination.replace(/^\/updates\//, "");
  // Round 107 — read the merged post's title/summary, not the seed
  // draftText, so this card never disagrees with the preview or the
  // editor once a post's been edited. Falls back to the old seed-parsing
  // if blogPost somehow wasn't resolved (shouldn't happen in practice).
  const [seedTitle, ...seedSummaryParts] = (draftText ?? "").split("\n\n");
  const blogTitle = blogPost?.title ?? seedTitle;
  const blogSummary = blogPost?.summary ?? seedSummaryParts.join("\n\n").trim();
  // Round 89's own instruction: if a channel's poster isn't configured,
  // the queue UI shows the item as manual_post (text ready to copy)
  // instead of offering an "auto-post" action that would just no-op.
  const hasRealPoster = REGISTERED_POSTER_CHANNELS.includes(channel);
  const effectiveMode = mode === "auto_post" && !hasRealPoster ? "manual_post" : mode;

  async function handlePosted(edited: boolean) {
    setPending(true);
    setError(null);
    try {
      await markPosted(id, text, edited);
      setDone(edited ? "edited_posted" : "posted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleReject() {
    setPending(true);
    setError(null);
    try {
      await rejectItem(id);
      setDone("rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleApproveAutoPost() {
    setPending(true);
    setError(null);
    // Round 90 fix: approveForAutoPost returns { ok, error } instead of
    // throwing (a thrown Server Action Error's message is redacted from
    // the client in Next.js production builds -- round 107's own standing
    // lesson, missed once already in this exact function before being
    // caught and fixed the same day).
    const result = await approveForAutoPost(id, text, channel);
    if (result.ok) {
      setDone("posted");
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 opacity-60">
        <p className="text-sm text-muted">
          {isBlog && done === "posted" ? (
            <>Blog — published.</>
          ) : (
            <>
              {CHANNEL_LABELS[channel] ?? channel} — marked <strong>{done}</strong>.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isEscalationOnly ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {CHANNEL_LABELS[channel] ?? channel} ·{" "}
          {effectiveMode === "auto_post" ? "auto-post (will post on approval)" : "manual — you post this yourself"}
        </p>
        {locale === "es" && (
          <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
            ES
          </span>
        )}
        {isEscalationOnly && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Flagged — no draft
          </span>
        )}
      </div>

      {isBlog && !isEscalationOnly ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={`/updates/${blogSlug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Preview post ↗
          </a>
          <a
            href={`/admin/updates/${blogSlug}/edit`}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Edit
          </a>
          <span className="font-mono text-xs text-muted">{blogSlug}</span>
        </div>
      ) : destination.startsWith("http") || destination.startsWith("/") ? (
        <a href={destination} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-brand-600 hover:underline dark:text-brand-400">
          {destination}
        </a>
      ) : (
        // Round 94 — the "outreach" channel's own destination isn't a
        // clickable URL or "new post" (it's a synthetic identifier for a
        // recipient-less sequence email, e.g. "attorney-campaign-email-
        // 1-intro") -- linking it would 404 against this admin page's own
        // path. Shown as plain text instead of a broken link.
        <span className="mt-2 block font-mono text-xs text-muted">{destination}</span>
      )}

      {MEDIA_CHANNELS.has(channel) && mediaRefs && (
        <div className="mt-3">
          {mediaRefs.endsWith(".mp4") ? (
            <video src={mediaRefs} controls className="max-h-96 rounded-lg border border-border-strong" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- a generated asset URL, not something next/image's optimizer has ever seen
            <img src={mediaRefs} alt="" className="max-h-96 rounded-lg border border-border-strong" />
          )}
        </div>
      )}

      {isEscalationOnly ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Why this needs your own read, not a draft
          </p>
          <p className="mt-1 text-sm text-foreground/90">{guardrailNotes}</p>
        </div>
      ) : (
        <>
          {guardrailNotes && <p className="mt-3 text-xs text-muted">{guardrailNotes}</p>}
          {sourceCitations && (
            <p className="mt-1 text-xs text-muted">
              <strong>Grounded in:</strong> {sourceCitations}
            </p>
          )}

          {isBlog ? (
            <div className="mt-3">
              <p className="font-semibold text-foreground">{blogTitle}</p>
              <p className="mt-1 text-sm text-muted">{blogSummary}</p>
              <p className="mt-2 text-xs text-muted">
                Read the full post with <strong>Preview post</strong> above before deciding — this card doesn&apos;t
                show the article itself. Use <strong>Edit</strong> above to change the title, summary, sources, or
                body without a deploy.
              </p>
            </div>
          ) : (
            <>
              <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-muted">
                Draft (edit before marking posted, if needed)
              </label>
              {channel === "x" && (
                <p className="mb-1.5 text-xs text-muted">
                  A line containing only <code>---</code> separates thread posts — keep them if you keep the thread
                  structure.
                </p>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                disabled={pending}
                className="mt-1.5 w-full rounded-lg border border-border-strong bg-background p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              />
            </>
          )}
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-3">
        {!isEscalationOnly && effectiveMode === "manual_post" && (
          <>
            <PendingButton
              type="button"
              disabled={!text.trim()}
              pending={pending}
              pendingLabel="Marking posted…"
              onClick={() => handlePosted(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark posted (as-is)
            </PendingButton>
            <PendingButton
              type="button"
              disabled={!text.trim() || text === draftText}
              pending={pending}
              pendingLabel="Marking posted…"
              onClick={() => handlePosted(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark posted (edited)
            </PendingButton>
          </>
        )}
        {!isEscalationOnly && effectiveMode === "auto_post" && (
          <PendingButton
            type="button"
            disabled={!text.trim()}
            pending={pending}
            pendingLabel={isBlog ? "Publishing…" : "Approving…"}
            onClick={handleApproveAutoPost}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBlog ? "Publish to /updates" : "Approve (queue for auto-post)"}
          </PendingButton>
        )}
        <PendingButton
          type="button"
          pending={pending}
          pendingLabel={isEscalationOnly ? "Dismissing…" : "Rejecting…"}
          onClick={handleReject}
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          spinnerClassName="h-3.5 w-3.5"
        >
          {isEscalationOnly ? "Acknowledge / dismiss" : "Reject"}
        </PendingButton>
      </div>
    </div>
  );
}
