"use client";

import { useState, useTransition } from "react";
import { addSocialChannelConfig } from "./actions";
import { CHANNEL_LABELS } from "@/lib/marketing/channel-labels";

export function AddChannelForm({ addable }: { addable: string[] }) {
  const [channel, setChannel] = useState(addable[0] ?? "");
  const [pending, startTransition] = useTransition();

  if (addable.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2">
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="rounded border border-border-strong bg-background px-2 py-1 text-sm"
      >
        {addable.map((c) => (
          <option key={c} value={c}>
            {CHANNEL_LABELS[c] ?? c}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => addSocialChannelConfig(channel))}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:border-brand-500 disabled:opacity-60 dark:text-brand-400"
      >
        {pending ? "Adding…" : "Add channel"}
      </button>
    </div>
  );
}
