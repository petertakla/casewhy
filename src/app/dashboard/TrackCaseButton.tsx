"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { trackCase, untrackCase } from "./actions";

export function TrackCaseButton({
  receiptNumber,
  trackedCaseId,
  alreadyTracked,
  atCap,
  maxCases,
}: {
  receiptNumber: string;
  /** Present when alreadyTracked — the row id, needed to untrack. */
  trackedCaseId?: string;
  alreadyTracked: boolean;
  atCap: boolean;
  maxCases: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (alreadyTracked && trackedCaseId) {
    return (
      <div className="flex items-center gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-500">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tracked
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await untrackCase(trackedCaseId);
          })}
          className="text-xs font-semibold text-muted hover:text-red-500 hover:underline disabled:opacity-60"
        >
          {isPending ? "Removing…" : "Stop tracking"}
        </button>
      </div>
    );
  }

  if (atCap) {
    return (
      <p className="text-xs text-muted">
        You&apos;re tracking the maximum of {maxCases} case{maxCases === 1 ? "" : "s"} on your
        plan. Untrack one to add this, or{" "}
        <Link href="/plus" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          upgrade to CaseWhy Plus
        </Link>{" "}
        for up to 5 cases.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          setError(null);
          try {
            await trackCase(receiptNumber);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        })}
        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Track this case"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
