import type { Metadata } from "next";
import {
  PROCESSING_TIMES,
  PROCESSING_TIMES_AS_OF,
  PROCESSING_TIMES_SOURCE_URL,
  FIELD_OFFICE_ONLY_FORMS,
  VISA_BULLETIN_TIED_NOTE,
  OFFICE_LOCATOR_URL,
  ASC_LOCATOR_URL,
} from "@/lib/kb/processing-times";
import { ShareButton } from "@/components/ShareButton";

export const metadata: Metadata = {
  title: "USCIS Processing Times by Form | CaseWhy",
  description:
    "USCIS's own published processing-time estimates for N-400, I-485, I-765, I-130, and other common case types, kept current.",
};

// Round 73 — direct-answer block + FAQPage schema, so the page's own
// existing "80% of cases..." explanation (previously only at the very
// bottom) is extractable near the top for search snippets/AI answers too.
// See round73-seo-geo-foundation-task.md item 3-4.
const PERCENTILE_FAQ_ANSWER =
  "USCIS bases each processing-time figure on how long it took to complete 80% of cases over the past six months. It's a reference point, not a guarantee — individual cases vary, and the figure updates as USCIS republishes its own data.";

export default function ProcessingTimesPage() {
  const months = PROCESSING_TIMES.map((e) => e.percentile80Months);
  const minMonths = Math.min(...months);
  const maxMonths = Math.max(...months);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does '80% of cases completed within X months' mean?",
        acceptedAnswer: { "@type": "Answer", text: PERCENTILE_FAQ_ANSWER },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-2xl font-bold tracking-tight">Processing times</h1>
      <p className="mb-2 mt-2 text-muted">
        USCIS&apos;s own published processing-time estimates, for the case types CaseWhy tracks.
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        USCIS&apos;s own published estimates for the case types CaseWhy tracks currently range
        from {minMonths} to {maxMonths} months for 80% of cases to complete, depending on form and
        office.
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

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/processing-times"
          title="CaseWhy — Processing times"
          text="See USCIS processing-time estimates for real case types, for free, with CaseWhy."
        />
      </div>

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
        <p className="mt-4 text-sm text-muted">{VISA_BULLETIN_TIED_NOTE}</p>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Find your specific office
        </p>
        <p className="mt-2 text-sm text-muted">
          The figures above are national numbers. For a field-office-dependent form (N-400,
          family-based I-485) or to find where a biometrics appointment happens, look up your own
          office directly on USCIS&apos;s site — it&apos;s the current, official source and not
          something CaseWhy keeps a copy of:
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a
            href={OFFICE_LOCATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            Find your field office
          </a>
          <a
            href={ASC_LOCATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            Find your Application Support Center
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        These are reference points, not a guarantee — USCIS bases each figure on how long it took
        to complete 80% of cases over the past six months, and individual cases vary.
      </p>
    </main>
  );
}
