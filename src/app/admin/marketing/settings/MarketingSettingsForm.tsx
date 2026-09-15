"use client";

import { useState, useTransition } from "react";
import { addSubreddit, toggleSubredditEnabled, removeSubreddit, updateDailyCap } from "./actions";

interface SubredditRow {
  id: string;
  sourceIdentifier: string;
  label: string;
  enabled: boolean;
}

export function MarketingSettingsForm({
  subreddits,
  dailyCap,
}: {
  subreddits: SubredditRow[];
  dailyCap: number;
}) {
  const [pending, startTransition] = useTransition();
  const [newSubreddit, setNewSubreddit] = useState("");
  const [capInput, setCapInput] = useState(String(dailyCap));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-base font-semibold text-foreground">Subreddit list (manual reference)</h2>
        <p className="mb-4 text-sm text-muted">
          Reddit is manual-only — <code>poll-marketing-sources</code> doesn&apos;t poll it (Reddit denied the API
          application and blocks the RSS fallback from our hosting provider too). This list is just a reference of
          subreddits worth checking by hand; the enabled toggle has no automated effect right now.
        </p>

        <div className="space-y-2">
          {subreddits.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <span className={row.enabled ? "text-foreground" : "text-muted line-through"}>{row.label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => toggleSubredditEnabled(row.id, !row.enabled))}
                  className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400 disabled:opacity-50"
                >
                  {row.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeSubreddit(row.id))}
                  className="text-xs font-semibold text-muted hover:text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {subreddits.length === 0 && <p className="text-sm text-muted">No subreddits configured.</p>}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSubreddit.trim()) return;
            startTransition(() => addSubreddit(newSubreddit));
            setNewSubreddit("");
          }}
        >
          <input
            value={newSubreddit}
            onChange={(e) => setNewSubreddit(e.target.value)}
            placeholder="e.g. USCISFamilyBased (no r/ needed)"
            disabled={pending}
            className="flex-1 rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !newSubreddit.trim()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-foreground">Daily draft cap</h2>
        <p className="mb-4 text-sm text-muted">
          Maximum new drafts <code>poll-marketing-sources</code> creates per day, across all community channels
          combined. Skipped and escalated items don&apos;t count against it.
        </p>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(capInput, 10);
            if (Number.isFinite(n)) startTransition(() => updateDailyCap(n));
          }}
        >
          <input
            type="number"
            min={1}
            max={100}
            value={capInput}
            onChange={(e) => setCapInput(e.target.value)}
            disabled={pending}
            className="w-24 rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || capInput === String(dailyCap)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-foreground">Product links</h2>
        <div className="rounded-lg border border-border-strong bg-surface-2 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">Disabled (read-only)</p>
          <p className="mt-1 text-muted">
            Flipped by round 96 after the production gate — not a toggle. No draft includes a CaseWhy URL, even to
            CaseWhy&apos;s own site, until then.
          </p>
        </div>
      </section>
    </div>
  );
}
