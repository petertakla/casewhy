"use client";

import { useState } from "react";
import { isValidReceiptNumberFormat } from "@/lib/uscis/receipt-number";

/**
 * Round 20, item 1 — real-time format feedback as the user types. Purely
 * client-side shape validation (3-letter prefix + 10 digits); never blocks
 * submission, since this can't confirm a receipt number is real, only that
 * it's well-formed. Feedback only starts once there's enough input to be
 * meaningful, so an empty/just-started field doesn't flash red immediately.
 */
export function ReceiptNumberInput({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const trimmed = value.trim();
  const showFeedback = trimmed.length >= 3;
  const valid = isValidReceiptNumberFormat(trimmed);

  return (
    <div className="relative flex-1">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.8} />
        <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      </svg>
      <input
        type="text"
        name="receipt"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. EAC9999103403"
        autoCapitalize="characters"
        autoComplete="off"
        aria-label="USCIS receipt number"
        aria-invalid={showFeedback && !valid}
        className={`w-full rounded-lg border bg-surface pl-10 pr-9 py-2.5 font-mono text-sm outline-none transition-shadow focus:ring-2 ${
          showFeedback && !valid
            ? "border-red-400 focus:ring-red-400"
            : "border-border-strong focus:ring-brand-500"
        }`}
      />
      {showFeedback && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {valid ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-emerald-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-red-400">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}
      {showFeedback && !valid && (
        <p className="mt-1.5 text-xs text-red-500">
          Receipt numbers are 3 letters followed by 10 digits (e.g. EAC9999103403).
        </p>
      )}
    </div>
  );
}
