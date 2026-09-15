"use client";

import { useState } from "react";
import { markPosted, rejectItem, approveForAutoPost } from "./actions";
import { REGISTERED_POSTER_CHANNELS } from "@/lib/marketing/posters/registry";
import { CHANNEL_LABELS } from "@/lib/marketing/channel-labels";

export function MarketingQueueCard({
  id,
  channel,
  mode,
  destination,
  draftText,
  sourceCitations,
  guardrailNotes,
}: {
  id: string;
  channel: string;
  mode: "manual_post" | "auto_post";
  destination: string;
  draftText: string | null;
  sourceCitations: string | null;
  guardrailNotes: string | null;
}) {
  const [text, setText] = useState(draftText ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const isEscalationOnly = !draftText;
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
    try {
      await approveForAutoPost(id, text, channel);
      setDone("posted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approved, but posting failed — check the error and retry, or handle it manually.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 opacity-60">
        <p className="text-sm text-muted">
          {CHANNEL_LABELS[channel] ?? channel} — marked <strong>{done}</strong>.
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
        {isEscalationOnly && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Flagged — no draft
          </span>
        )}
      </div>

      <a href={destination} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-brand-600 hover:underline dark:text-brand-400">
        {destination}
      </a>

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

          <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-muted">
            Draft (edit before marking posted, if needed)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            disabled={pending}
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-background p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
          />
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-3">
        {!isEscalationOnly && effectiveMode === "manual_post" && (
          <>
            <button
              type="button"
              disabled={pending || !text.trim()}
              onClick={() => handlePosted(false)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark posted (as-is)
            </button>
            <button
              type="button"
              disabled={pending || !text.trim() || text === draftText}
              onClick={() => handlePosted(true)}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark posted (edited)
            </button>
          </>
        )}
        {!isEscalationOnly && effectiveMode === "auto_post" && (
          <button
            type="button"
            disabled={pending || !text.trim()}
            onClick={handleApproveAutoPost}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve (queue for auto-post)
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={handleReject}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:opacity-60"
        >
          {isEscalationOnly ? "Acknowledge / dismiss" : "Reject"}
        </button>
      </div>
    </div>
  );
}
