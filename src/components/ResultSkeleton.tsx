// Round 114 follow-up, Finding 4 — a placeholder card shown where a
// result is about to land (the dashboard's status card, after "Look up
// status" is clicked), so the page visibly changes on the first click
// instead of sitting static until the new page finishes loading.

export function ResultSkeleton() {
  return (
    <div className="mt-6 animate-pulse rounded-xl border border-border bg-surface p-5" aria-hidden="true">
      <div className="h-5 w-40 rounded bg-surface-2" />
      <div className="mt-3 h-4 w-full rounded bg-surface-2" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surface-2" />
      <div className="mt-4 h-8 w-32 rounded-lg bg-surface-2" />
    </div>
  );
}
