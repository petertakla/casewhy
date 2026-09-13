"use client";

import { useState } from "react";
import { approveOutreachDraft, rejectOutreachDraft } from "./actions";

export function PendingOutreachCard({
  id,
  attorneyName,
  attorneyEmail,
  listingUrl,
  draftSubject,
  draftBody,
}: {
  id: string;
  attorneyName: string;
  attorneyEmail: string;
  listingUrl: string;
  draftSubject: string;
  draftBody: string;
}) {
  const [body, setBody] = useState(draftBody);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      await approveOutreachDraft(id, body);
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
      await rejectOutreachDraft(id);
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
          {attorneyName} — marked <strong>{done}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{attorneyEmail}</p>
      <p className="mt-2 text-sm text-foreground/90">
        <strong>To:</strong> {attorneyName} — <a href={listingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">{listingUrl}</a>
      </p>
      <p className="text-sm text-foreground/90">
        <strong>Subject:</strong> {draftSubject}
      </p>

      <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-muted">
        Draft (edit before approving if needed)
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        disabled={pending}
        className="mt-1.5 w-full rounded-lg border border-border-strong bg-background p-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending || !body.trim()}
          onClick={handleApprove}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve (queue — doesn&apos;t send)
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
