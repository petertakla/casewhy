"use client";

import { useState } from "react";
import { CASE_TYPES } from "@/lib/kb/case-type-timeline";

/**
 * Round 20, item 2 — informational only, doesn't affect the actual receipt-
 * number lookup above (USCIS's own API already returns the real form type
 * once a case is tracked). This just answers "how long does my kind of case
 * usually take" before/while someone adds their first case.
 */
export function CaseTypeTimelineHint() {
  const [selectedId, setSelectedId] = useState("");
  const selected = CASE_TYPES.find((c) => c.id === selectedId);

  return (
    <div className="mt-3">
      <label className="block text-xs font-medium text-muted" htmlFor="case-type-hint">
        Not sure what to expect? Pick your case type for a typical timeline
      </label>
      <select
        id="case-type-hint"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mt-1.5 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500 sm:w-auto"
      >
        <option value="">Select a case type…</option>
        {CASE_TYPES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {selected && (
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">{selected.timelineBlurb}</p>
      )}
    </div>
  );
}
