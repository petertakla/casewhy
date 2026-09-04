import { getCaseStatus, UscisApiError, type CaseStatus } from "@/lib/uscis/client";
import { explainCaseStatus, type CaseExplanation } from "@/lib/ai/explain";

function friendlyErrorMessage(err: UscisApiError): string {
  if (err.status === 404) {
    return "We couldn't find a case with that receipt number. Double-check it and try again.";
  }
  if (err.status === 401) {
    return "We're having trouble authenticating with USCIS right now. Please try again shortly.";
  }
  try {
    const parsed = JSON.parse(err.detail) as { message?: string; error?: { message?: string } };
    const message = parsed.message ?? parsed.error?.message;
    if (message) return message;
  } catch {
    // detail wasn't JSON — fall through to the generic message below.
  }
  return "USCIS's case status service is temporarily unavailable. Please try again shortly.";
}

function SearchForm({ receiptNumber }: { receiptNumber?: string }) {
  return (
    <form action="/dashboard" method="get" className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        name="receipt"
        required
        defaultValue={receiptNumber}
        placeholder="e.g. EAC9999103403"
        autoCapitalize="characters"
        autoComplete="off"
        aria-label="USCIS receipt number"
        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        Track case
      </button>
    </form>
  );
}

function ExplanationBox({ explanation }: { explanation: CaseExplanation }) {
  return (
    <div className="mt-4 rounded-lg bg-brand-50 dark:bg-brand-700/10 border border-brand-100 dark:border-brand-700/30 p-4">
      <p className="text-xs uppercase tracking-widest text-brand-600 dark:text-brand-500 mb-2">
        What this means
      </p>
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{explanation.explanation}</p>
      {explanation.nextSteps.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-neutral-700 dark:text-neutral-300 list-disc list-inside">
          {explanation.nextSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-neutral-500">
        General information, not legal advice. For guidance specific to your case, talk to a
        licensed immigration attorney.
      </p>
    </div>
  );
}

function StatusCard({
  status,
  explanation,
}: {
  status: CaseStatus;
  explanation: CaseExplanation | null;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {status.formType} · {status.receiptNumber}
          </p>
          <h2 className="text-xl font-bold mt-1">{status.statusText}</h2>
        </div>
        {status.modifiedDate && (
          <p className="text-xs text-neutral-500">Updated {status.modifiedDate}</p>
        )}
      </div>

      <p className="mt-4 text-neutral-700 dark:text-neutral-300">{status.statusDescription}</p>

      {explanation && <ExplanationBox explanation={explanation} />}

      {status.history.length > 0 && (
        <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">History</p>
          <ol className="space-y-3">
            {status.history.map((entry, i) => (
              <li key={i} className="text-sm">
                <span className="text-neutral-500">{entry.date}</span>
                <span className="mx-2 text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {entry.completed_text_en}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6">
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ receipt?: string }>;
}) {
  const { receipt } = await searchParams;
  const receiptNumber = receipt?.trim();

  let status: CaseStatus | null = null;
  let explanation: CaseExplanation | null = null;
  let errorMessage: string | null = null;

  if (receiptNumber) {
    try {
      status = await getCaseStatus(receiptNumber);
      try {
        explanation = await explainCaseStatus(status);
      } catch {
        // Explanation is a nice-to-have — show the raw status even if the model call fails.
      }
    } catch (err) {
      errorMessage = err instanceof UscisApiError
        ? friendlyErrorMessage(err)
        : "Something went wrong looking up your case. Please try again.";
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your case</h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        Enter your USCIS receipt number to see its current status.
      </p>

      <SearchForm receiptNumber={receiptNumber} />

      <div className="mt-6">
        {status && <StatusCard status={status} explanation={explanation} />}
        {errorMessage && <ErrorCard message={errorMessage} />}
        {!status && !errorMessage && !receiptNumber && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-sm text-neutral-500">
              No case tracked yet — enter a receipt number above to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
