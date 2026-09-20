"use client";

import { useState } from "react";
import { updateSocialChannelConfig } from "./actions";
import { CHANNEL_LABELS } from "@/lib/marketing/channel-labels";
import { REGISTERED_POSTER_CHANNELS } from "@/lib/marketing/posters/registered-channels";

export function SocialChannelConfigRow({
  id,
  channel,
  minIntervalMinutes,
  mode,
  enabled,
  notes,
}: {
  id: string;
  channel: string;
  minIntervalMinutes: number;
  mode: "manual_post" | "auto_post";
  enabled: boolean;
  notes: string | null;
}) {
  const [interval, setInterval_] = useState(minIntervalMinutes);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [noteText, setNoteText] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasRealPoster = REGISTERED_POSTER_CHANNELS.includes(channel);
  // facebook's real mode is always decided per call site (owned Page vs.
  // Groups, SOCIAL_MEDIA_GUARDRAILS Section 0) -- see schema.ts's own
  // comment on socialChannelConfigs. Never editable here.
  const modeLocked = channel === "facebook";

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateSocialChannelConfig(id, { minIntervalMinutes: interval, mode: selectedMode, enabled: isEnabled, notes: noteText.trim() || null });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{CHANNEL_LABELS[channel] ?? channel}</p>
        {!hasRealPoster && (
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs font-semibold text-muted">No poster configured yet — always stages for review</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted">
          Min. gap between posts
          <input
            type="number"
            min={0}
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            className="w-20 rounded border border-border-strong bg-background px-2 py-1 text-sm"
          />
          min (0 = no extra throttle)
        </label>

        <label className="flex items-center gap-2 text-xs text-muted">
          Mode
          {modeLocked ? (
            <span className="rounded border border-border-strong bg-background px-2 py-1 text-sm text-muted" title="Facebook Page posts auto-post; Facebook Group posts always stage for review, per SOCIAL_MEDIA_GUARDRAILS.md Section 0 -- not admin-overridable.">
              Page: auto-post · Groups: always manual
            </span>
          ) : (
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as "manual_post" | "auto_post")}
              className="rounded border border-border-strong bg-background px-2 py-1 text-sm"
            >
              <option value="manual_post">Stage for review</option>
              <option value="auto_post" disabled={!hasRealPoster}>
                Auto-post{!hasRealPoster ? " (needs a poster first)" : ""}
              </option>
            </select>
          )}
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
