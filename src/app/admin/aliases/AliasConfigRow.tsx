"use client";

import { useState } from "react";
import { updateAliasConfig } from "./actions";

export function AliasConfigRow({
  id,
  alias,
  purpose,
  pollIntervalMinutes,
  actionLevel,
  enabled,
  lastPolledAt,
}: {
  id: string;
  alias: string;
  purpose: string;
  pollIntervalMinutes: number;
  actionLevel: "draft_only" | "draft_and_flag_urgent";
  enabled: boolean;
  lastPolledAt: Date | null;
}) {
  const [interval, setInterval_] = useState(pollIntervalMinutes);
  const [level, setLevel] = useState(actionLevel);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateAliasConfig(id, { pollIntervalMinutes: interval, actionLevel: level, enabled: isEnabled });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold">{alias}@casewhy.com</p>
          <p className="text-xs text-muted">{purpose}</p>
        </div>
        <p className="text-xs text-muted">
          Last polled: {lastPolledAt ? new Date(lastPolledAt).toLocaleString() : "never"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted">
          Poll every
          <input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            className="w-20 rounded border border-border-strong bg-background px-2 py-1 text-sm"
          />
          min
        </label>

        <label className="flex items-center gap-2 text-xs text-muted">
          Action level
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as "draft_only" | "draft_and_flag_urgent")}
            className="rounded border border-border-strong bg-background px-2 py-1 text-sm"
          >
            <option value="draft_only">Draft only</option>
            <option value="draft_and_flag_urgent">Draft + urgent alert</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
          Enabled
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:border-brand-500 disabled:opacity-60 dark:text-brand-400"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
