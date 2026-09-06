import Link from "next/link";
import { getCaseStatus, UscisApiError, type CaseStatus } from "@/lib/uscis/client";
import { explainCaseStatus, type CaseExplanation } from "@/lib/ai/explain";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "./actions";
import { getSubscriptionTier, TIER_LIMITS } from "@/lib/billing/tier";
import { TrackCaseButton } from "./TrackCaseButton";
import { CheckNowButton } from "./CheckNowButton";
import { DownloadReportLink } from "./DownloadReportLink";
import { CaseSwitcher } from "./CaseSwitcher";
import { DocumentVault } from "./DocumentVault";
import { detectStalledCase } from "@/lib/escalation/stall-detector";
import { EscalationToolkit } from "./EscalationToolkit";

export const dynamic = "force-dynamic";

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

/** Semantic color for a status pill, matched loosely against USCIS's own wording. */
function statusTone(statusText: string): { dot: string; text: string; bg: string } {
  const s = statusText.toLowerCase();
  if (s.includes("approved") || s.includes("card was delivered") || s.includes("naturalization oath")) {
    return { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
  }
  if (s.includes("denied") || s.includes("rejected") || s.includes("terminated")) {
    return { dot: "bg-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  }
  if (s.includes("request for evidence") || s.includes("rfe") || s.includes("interview")) {
    return { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  }
  return { dot: "bg-brand-500", text: "text-brand-600 dark:text-brand-400", bg: "bg-brand-500/10" };
}

function SearchForm({ receiptNumber }: { receiptNumber?: string }) {
  return (
    <form action="/dashboard" method="get" className="flex flex-col gap-3 sm:flex-row">
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
          defaultValue={receiptNumber}
          placeholder="e.g. EAC9999103403"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="USCIS receipt number"
          className="w-full rounded-lg border border-border-strong bg-surface pl-10 pr-4 py-2.5 font-mono text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Track case
      </button>
    </form>
  );
}

/**
 * CW-39, Part A — free on every tier. Surfaces a real delay honestly
 * regardless of payment; only the escalation tools that follow are
 * Plus-gated. See src/lib/escalation/stall-detector.ts for the (honestly
 * approximate — see its own comment) benchmark this uses.
 */
function StalledCaseCard({ daysSinceLastUpdate, milestoneText }: { daysSinceLastUpdate: number; milestoneText: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex gap-3 border-l-4 border-l-amber-500 p-4">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            This case looks delayed
          </p>
          <p className="mt-1.5 text-sm text-foreground/90">
            It&apos;s been {daysSinceLastUpdate} days since &quot;{milestoneText}&quot; with no further update —
            longer than typical for this stage. Sign in and upgrade to CaseWhy Plus to find your
            representative and draft a follow-up letter.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExplanationBox({ explanation }: { explanation: CaseExplanation }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-brand-500/20 bg-surface-2">
      <div className="flex gap-3 border-l-4 border-l-brand-500 p-4">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.6.5 1.1v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1c0-.5.1-.8.5-1.1A6 6 0 0 0 12 3ZM10 20h4"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            What this means
          </p>
          <p className="mt-1.5 text-sm text-foreground/90">{explanation.explanation}</p>
          {explanation.nextSteps.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {explanation.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}
          {explanation.relatedPolicies.length > 0 && (
            <div className="mt-3 border-t border-brand-500/15 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Policy background referenced above
              </p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {explanation.relatedPolicies.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {p.title}
                    </a>
                    <span className="text-muted"> — {p.sourceTitle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            General information, not legal advice. For guidance specific to your case, talk to a
            licensed immigration attorney.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  status,
  explanation,
  tracking,
}: {
  status: CaseStatus;
  explanation: CaseExplanation | null;
  tracking: {
    signedIn: boolean;
    alreadyTracked: boolean;
    trackedCaseId?: string;
    lastCheckedAt?: Date | null;
    canCheckNow: boolean;
    canDownloadReport: boolean;
    canUseVault: boolean;
    atCap: boolean;
    maxCases: number;
  } | null;
}) {
  const tone = statusTone(status.statusText);
  const stall = detectStalledCase(status);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {status.formType} · {status.receiptNumber}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {status.statusText}
            </span>
          </div>
        </div>
        {status.modifiedDate && (
          <p className="text-xs text-muted">Updated {status.modifiedDate}</p>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground/90">{status.statusDescription}</p>

      {stall.isStalled && stall.milestoneText && (
        <StalledCaseCard daysSinceLastUpdate={stall.daysSinceLastUpdate} milestoneText={stall.milestoneText} />
      )}

      {tracking && (
        <div className="mt-3">
          {tracking.signedIn ? (
            <>
              <TrackCaseButton
                receiptNumber={status.receiptNumber}
                trackedCaseId={tracking.trackedCaseId}
                alreadyTracked={tracking.alreadyTracked}
                atCap={tracking.atCap}
                maxCases={tracking.maxCases}
              />
              {tracking.alreadyTracked && tracking.trackedCaseId && (
                <>
                  <CheckNowButton
                    trackedCaseId={tracking.trackedCaseId}
                    lastCheckedAt={tracking.lastCheckedAt ?? null}
                    canCheckNow={tracking.canCheckNow}
                  />
                  <DownloadReportLink
                    receiptNumber={status.receiptNumber}
                    canDownload={tracking.canDownloadReport}
                  />
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted">
              <Link href="/auth/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Sign in
              </Link>{" "}
              to save this case.
            </p>
          )}
        </div>
      )}

      {explanation && <ExplanationBox explanation={explanation} />}

      {status.history.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">History</p>
          <ol className="relative space-y-5 border-l border-border pl-5">
            {status.history.map((entry, i) => (
              <li key={i} className="relative text-sm">
                <span
                  className={`absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                    i === 0 ? "bg-brand-500" : "bg-border-strong"
                  }`}
                />
                <span className="block font-mono text-xs text-muted">{entry.date}</span>
                <span className="mt-0.5 block text-foreground/90">{entry.completed_text_en}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <DocumentVault trackedCaseId={tracking?.trackedCaseId} canUseVault={tracking?.canUseVault ?? false} />

      {tracking?.trackedCaseId && (
        <EscalationToolkit trackedCaseId={tracking.trackedCaseId} canUseToolkit={tracking?.canUseVault ?? false} />
      )}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ receipt?: string }>;
}) {
  const { receipt } = await searchParams;
  const { data: session } = await auth.getSession();

  let trackedCasesList: Awaited<ReturnType<typeof getTrackedCases>> = [];
  let maxCases = TIER_LIMITS.free.maxCases;
  let canCheckNow = false;
  if (session?.user) {
    trackedCasesList = await getTrackedCases(session.user.id);
    const tier = await getSubscriptionTier(session.user.id);
    maxCases = TIER_LIMITS[tier].maxCases;
    canCheckNow = tier === "plus";
  }

  // An explicit ?receipt= search always wins (ad-hoc lookup); otherwise fall
  // back to the signed-in user's first tracked case, if any (CW-36: could
  // be one of several — see CaseSwitcher below for picking a different one).
  const receiptNumber = receipt?.trim() || trackedCasesList[0]?.receiptNumber || undefined;

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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Your case</h1>
      <p className="mb-8 mt-2 text-muted">
        Enter your USCIS receipt number to see its current status.
      </p>

      <SearchForm receiptNumber={receiptNumber} />

      {trackedCasesList.length > 1 && (
        <CaseSwitcher
          cases={trackedCasesList}
          activeReceiptNumber={receiptNumber}
          basePath="/dashboard"
        />
      )}

      <div className="mt-6">
        {status && (
          <StatusCard
            status={status}
            explanation={explanation}
            tracking={{
              signedIn: !!session?.user,
              alreadyTracked: trackedCasesList.some((c) => c.receiptNumber === status.receiptNumber),
              trackedCaseId: trackedCasesList.find((c) => c.receiptNumber === status.receiptNumber)?.id,
              lastCheckedAt: trackedCasesList.find((c) => c.receiptNumber === status.receiptNumber)?.lastCheckedAt,
              canCheckNow,
              canDownloadReport: canCheckNow,
              canUseVault: canCheckNow,
              atCap: trackedCasesList.length >= maxCases,
              maxCases,
            }}
          />
        )}
        {errorMessage && <ErrorCard message={errorMessage} />}
        {!status && !errorMessage && !receiptNumber && (
          <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
            <p className="text-sm text-muted">
              No case tracked yet — enter a receipt number above to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
