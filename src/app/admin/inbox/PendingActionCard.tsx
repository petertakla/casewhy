"use client";

import { useState } from "react";
import { approvePendingAction, rejectPendingAction } from "./actions";

export function PendingActionCard({
  id,
  fromAddress,
  subject,
  receivedAt,
  summary,
  draftReply,
  proposedAction,
  urgent,
  alias,
  purpose,
}: {
  id: string;
  fromAddress: string;
  subject: string;
  receivedAt: Date;
  summary: string;
  draftReply: string | null;
  proposedAction: string | null;
  urgent: boolean;
  alias: string;
  purpose: string;
}) {
  const [reply, setReply] = useState(draftReply ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      await approvePendingAction(id, reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleReject() {
    setPending(true);
    setError(null);
    try {
      await rejectPendingAction(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-6 ${
        urgent ? "border-red-500/40 bg-red-500/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {alias}@casewhy.com — {purpose}
        </p>
        {urgent && (
          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
            Urgent
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-foreground/90">
        <strong>From:</strong> {fromAddress}
      </p>
      <p className="text-sm text-foreground/90">
        <strong>Subject:</strong> {subject}
      </p>
      <p className="mt-1 text-xs text-muted">Received {new Date(receivedAt).toLocaleString()}</p>

      <div className="mt-3 rounded-lg border border-border-strong bg-surface-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Summary</p>
        <p className="mt-1 text-sm text-foreground/90">{summary}</p>
        {proposedAction && (
          <>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted">
              Proposed action
            </p>
            <p className="mt-1 text-sm text-foreground/90">{proposedAction}</p>
          </>
        )}
      </div>

      <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-muted">
        Draft reply (edit before approving if needed)
      </label>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={6}
        disabled={pending}
        className="mt-1.5 w-full rounded-lg border border-border-strong bg-background p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending || !reply.trim()}
          onClick={handleApprove}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve &amp; send
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleReject}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
