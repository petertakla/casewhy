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
    return <p className="text-xs text-neutral-500">Currently your tracked case.</p>;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await trackCase(receiptNumber);
        setDone(true);
      })}
      className="text-xs font-semibold text-brand-600 dark:text-brand-500 hover:underline disabled:opacity-60"
    >
      {isPending ? "Saving…" : "Track this case"}
    </button>
  );
}
