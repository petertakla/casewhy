"use client";

import { useState } from "react";
import { approveReply, rejectReply } from "./actions";

export function PendingCommunityReplyCard({
  id,
  source,
  sourceName,
  threadUrl,
  threadTitle,
  threadExcerpt,
  relevanceReason,
  draftReply,
  escalationReason,
  sourceCitation,
  selfPromoNote,
}: {
  id: string;
  source: "reddit" | "rss";
  sourceName: string;
  threadUrl: string;
  threadTitle: string;
  threadExcerpt: string;
  relevanceReason: string;
  draftReply: string | null;
  escalationReason: string | null;
  sourceCitation: string | null;
  selfPromoNote: string | null;
}) {
  const [body, setBody] = useState(draftReply ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const isEscalationOnly = !draftReply && Boolean(escalationReason);

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      await approveReply(id, body);
      setDone("approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleReject() {
    setPending(true);
    setError(null);
    try {
      await rejectReply(id);
      setDone("rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 opacity-60">
        <p className="text-sm text-muted">
          {threadTitle} — marked <strong>{done}</strong>.
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
          {source === "reddit" ? "Reddit" : "RSS"} — {sourceName}
        </p>
        {isEscalationOnly && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Flagged — no draft
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-foreground/90">
        <strong>{threadTitle}</strong>
      </p>
      <a href={threadUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
        {threadUrl}
      </a>

      <div className="mt-3 rounded-lg border border-border-strong bg-surface-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Thread excerpt</p>
        <p className="mt-1 line-clamp-4 text-sm text-foreground/80">{threadExcerpt || "(no body text)"}</p>
      </div>

      {isEscalationOnly ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Why this needs your own read, not a draft
          </p>
          <p className="mt-1 text-sm text-foreground/90">{escalationReason}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted">
            <strong>Why relevant:</strong> {relevanceReason}
          </p>
          {sourceCitation && (
            <p className="mt-1 text-xs text-muted">
              <strong>Grounded in:</strong> {sourceCitation}
            </p>
          )}
          {selfPromoNote && (
            <p className="mt-2 rounded-lg border border-border-strong bg-surface-2 p-2.5 text-xs text-muted">
              <strong>Self-promo note:</strong> {selfPromoNote}
            </p>
          )}

          <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-muted">
            Draft reply (edit before approving if needed)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            disabled={pending}
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-background p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
          />
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex gap-3">
        {!isEscalationOnly && (
          <button
            type="button"
            disabled={pending || !body.trim()}
            onClick={handleApprove}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approved — ready to post
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
