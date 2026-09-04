"use client";

import { useState, useTransition } from "react";
import { trackCase } from "./actions";

export function TrackCaseButton({
  receiptNumber,
  alreadyTracked,
}: {
  receiptNumber: string;
  alreadyTracked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyTracked);

  if (done) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-500">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Currently your tracked case.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await trackCase(receiptNumber);
        setDone(true);
      })}
      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-60"
    >
      {isPending ? "Saving…" : "Track this case"}
    </button>
  );
}
