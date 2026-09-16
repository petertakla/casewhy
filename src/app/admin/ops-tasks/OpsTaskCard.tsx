"use client";

import { useState } from "react";
import { markOpsTaskDone, dismissOpsTask } from "./actions";

export function OpsTaskCard({
  id,
  title,
  description,
  createdAt,
}: {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"done" | "dismissed" | null>(null);

  async function handleDone() {
    setPending(true);
    setError(null);
    try {
      await markOpsTaskDone(id);
      setDone("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleDismiss() {
    setPending(true);
    setError(null);
    try {
      await dismissOpsTask(id);
      setDone("dismissed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 opacity-60">
        <p className="text-sm text-muted">
          {title} — marked <strong>{done}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{createdAt}</p>
      <p className="mt-2 font-semibold text-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{description}</p>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={handleDone}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark done
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDismiss}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
