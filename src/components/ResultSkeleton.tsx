// Round 114 follow-up, Finding 4 — a placeholder card shown where a
// result is about to land (the dashboard's status card, after "Look up
// status" is clicked), so the page visibly changes on the first click
// instead of sitting static until the new page finishes loading.
//
// Round 115, Part 2 — optional titleText. Switching between tracked
// receipts left this skeleton blank/generic while the receipt input and
// list row had already jumped to the new (target) receipt, so this was
// the one place on screen still showing nothing case-specific during the
// wait. When the caller knows the target receipt, titleText renders it
// as a real (non-decorative) line instead of a generic grey bar.
export function ResultSkeleton({ titleText }: { titleText?: string } = {}) {
  return (
    <div className="mt-6 animate-pulse rounded-xl border border-border bg-surface p-5">
      {titleText ? (
        <p className="h-5 text-sm font-medium text-muted" aria-live="polite">
          {titleText}
        </p>
      ) : (
        <div className="h-5 w-40 rounded bg-surface-2" aria-hidden="true" />
      )}
      <div className="mt-3 h-4 w-full rounded bg-surface-2" aria-hidden="true" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surface-2" aria-hidden="true" />
      <div className="mt-4 h-8 w-32 rounded-lg bg-surface-2" aria-hidden="true" />
    </div>
  );
}
