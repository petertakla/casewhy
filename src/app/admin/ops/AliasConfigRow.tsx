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
  notes,
  lastPolledAt,
  pendingCount,
  locked,
}: {
  id: string;
  alias: string;
  purpose: string;
  pollIntervalMinutes: number;
  actionLevel: "draft_only" | "draft_and_flag_urgent";
  enabled: boolean;
  notes: string | null;
  lastPolledAt: Date | null;
  pendingCount: number;
  /** security@/legal@ -- round 70's original rule, never relaxed. Interval/action-level inputs are disabled; enforced server-side too, see actions.ts. */
  locked: boolean;
}) {
  const [interval, setInterval_] = useState(pollIntervalMinutes);
  const [level, setLevel] = useState(actionLevel);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [noteText, setNoteText] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateAliasConfig(id, alias, { pollIntervalMinutes: interval, actionLevel: level, enabled: isEnabled, notes: noteText.trim() || null });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold">
            {alias}@casewhy.com
            {locked && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Locked — immediate
              </span>
            )}
          </p>
          <p className="text-xs text-muted">{purpose}</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>{pendingCount} pending</p>
          <p>Last polled: {lastPolledAt ? new Date(lastPolledAt).toLocaleString() : "never"}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted">
          Poll every
          <input
            type="number"
            min={1}
            value={interval}
            disabled={locked}
            onChange={(e) => setInterval_(Number(e.target.value))}
            className="w-20 rounded border border-border-strong bg-background px-2 py-1 text-sm disabled:opacity-50"
          />
          min
        </label>

        <label className="flex items-center gap-2 text-xs text-muted">
          Action level
          <select
            value={level}
            disabled={locked}
            onChange={(e) => setLevel(e.target.value as "draft_only" | "draft_and_flag_urgent")}
            className="rounded border border-border-strong bg-background px-2 py-1 text-sm disabled:opacity-50"
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

      <textarea
        value={noteText}
        onChange={(e) => {
          setNoteText(e.target.value);
          setSaved(false);
        }}
        placeholder="Notes (visible to Cloud and Code both — e.g. a status update or a question)"
        rows={2}
        className="mt-3 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-xs"
      />
    </div>
  );
}
