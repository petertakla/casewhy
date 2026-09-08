"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { trackCase, untrackCase } from "./actions";
import { CASE_TYPES } from "@/lib/kb/case-type-timeline";

export function TrackCaseButton({
  receiptNumber,
  trackedCaseId,
  alreadyTracked,
  atCap,
  maxCases,
  plusMaxCases,
}: {
  receiptNumber: string;
  /** Present when alreadyTracked — the row id, needed to untrack. */
  trackedCaseId?: string;
  alreadyTracked: boolean;
  atCap: boolean;
  maxCases: number;
  /** CaseWhy Plus's own cap — shown in the free-tier "upgrade" message. */
  plusMaxCases: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [caseType, setCaseType] = useState("");
  const selected = CASE_TYPES.find((c) => c.id === caseType);

  // Round 22 — the list grew past a flat dropdown (9 real types + "Other"),
  // grouped into optgroups. Grouping is derived here, in array order, rather
  // than duplicated as a separate data structure.
  const groupedOptions: { group: string; options: typeof CASE_TYPES }[] = [];
  const ungrouped: typeof CASE_TYPES = [];
  for (const option of CASE_TYPES) {
    if (!option.group) {
      ungrouped.push(option);
      continue;
    }
    let bucket = groupedOptions.find((g) => g.group === option.group);
    if (!bucket) {
      bucket = { group: option.group, options: [] };
      groupedOptions.push(bucket);
    }
    bucket.options.push(option);
  }

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
        for up to {plusMaxCases} cases.
      </p>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-muted" htmlFor="track-case-type">
        What kind of case is this?
      </label>
      <select
        id="track-case-type"
        value={caseType}
        onChange={(e) => setCaseType(e.target.value)}
        required
        className="mt-1 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Select a case type…</option>
        {groupedOptions.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </optgroup>
        ))}
        {ungrouped.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted">
        Enter your form type for a more detailed, form-specific AI response.
      </p>
      {selected && <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted">{selected.timelineBlurb}</p>}
      <button
        type="button"
        disabled={isPending || !caseType}
        onClick={() => startTransition(async () => {
          setError(null);
          try {
            await trackCase(receiptNumber, caseType);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        })}
        className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Track this case"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
