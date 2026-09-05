import {
  PROCESSING_TIMES,
  PROCESSING_TIMES_AS_OF,
  PROCESSING_TIMES_SOURCE_URL,
  FIELD_OFFICE_ONLY_FORMS,
} from "@/lib/kb/processing-times";

export default function ProcessingTimesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Processing times</h1>
      <p className="mb-2 mt-2 text-muted">
        USCIS&apos;s own published processing-time estimates, for the case types CaseWhy tracks.
      </p>
      <p className="mb-8 text-xs text-muted">
        As of {PROCESSING_TIMES_AS_OF} —{" "}
        <a
          href={PROCESSING_TIMES_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          check the official tool for your exact form and office
        </a>
      </p>

      <div className="space-y-4">
        {PROCESSING_TIMES.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {entry.formType} <span className="font-normal text-muted">— {entry.categoryLabel}</span>
              </p>
              <p className="text-xs text-muted">{entry.office}</p>
            </div>
            <p className="mt-2 text-sm">
              80% of cases completed within{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {entry.percentile80Months} {entry.percentile80Months === 1 ? "month" : "months"}
              </span>
            </p>
            {entry.note && <p className="mt-2 text-xs text-muted">{entry.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border-strong p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Not shown above — office-specific, no national figure
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {FIELD_OFFICE_ONLY_FORMS.map((f) => (
            <li key={`${f.formType}-${f.categoryLabel ?? "default"}`}>
              <span className="font-semibold">{f.formType}</span>
              {f.categoryLabel && <span className="text-muted"> — {f.categoryLabel}</span>}
              <p className="mt-0.5 text-muted">{f.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-xs text-muted">
        These are reference points, not a guarantee — USCIS bases each figure on how long it took
        to complete 80% of cases over the past six months, and individual cases vary.
      </p>
    </main>
  );
}
