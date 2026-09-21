import Link from "next/link";
import { getCaseStatus, UscisApiError, type CaseStatus } from "@/lib/uscis/client";
import { recordCaseHistory } from "@/lib/uscis/check-status";
import { renderNoticeText } from "@/lib/uscis/notice-text";
import { explainCaseStatus, type CaseExplanation } from "@/lib/ai/explain";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "./actions";
import { getSubscriptionDetails, TIER_LIMITS, PLUS_HARD_CEILING_MAX_CASES } from "@/lib/billing/tier";
import { checkAndRecordFreeLifetimeLookup, getFreeLifetimeLookupCount } from "@/lib/billing/receipt-lookups";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { TrackCaseButton } from "./TrackCaseButton";
import { CheckNowButton } from "./CheckNowButton";
import { DownloadReportLink } from "./DownloadReportLink";
import { TrackedCasesList } from "./TrackedCasesList";
import { DocumentVault } from "./DocumentVault";
import { PlusBadge } from "@/components/PlusBadge";
import { detectStalledCase } from "@/lib/escalation/stall-detector";
import { EscalationToolkit } from "./EscalationToolkit";
import { DashboardSearchArea } from "./DashboardSearchArea";
import { linkifyExplanation } from "@/lib/kb/linkify";
import { PositiveShareNudge } from "./PositiveShareNudge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";

// Round 80 — three of these four branches are CaseWhy's own authored copy
// (fixed UI chrome for the 404/401/generic-fallback cases), so those get
// translated. The one real exception is the middle try/catch: `message`
// there is extracted straight from USCIS's own JSON error body — genuinely
// upstream text, same Track 2 reasoning as the raw status text elsewhere on
// this page — left untouched either way since it's already dynamic, not a
// hardcoded string to translate.
function friendlyErrorMessage(err: UscisApiError, es: boolean): string {
  if (err.status === 404) {
    return es
      ? "No pudimos encontrar un caso con ese número de recibo. Verifícalo e intenta de nuevo."
      : "We couldn't find a case with that receipt number. Double-check it and try again.";
  }
  if (err.status === 401) {
    return es
      ? "Estamos teniendo problemas para autenticarnos con USCIS en este momento. Por favor intenta de nuevo en un momento."
      : "We're having trouble authenticating with USCIS right now. Please try again shortly.";
  }
  try {
    const parsed = JSON.parse(err.detail) as { message?: string; error?: { message?: string } };
    const message = parsed.message ?? parsed.error?.message;
    if (message) return message;
  } catch {
    // detail wasn't JSON — fall through to the generic message below.
  }
  return es
    ? "El servicio de estado de casos de USCIS no está disponible temporalmente. Por favor intenta de nuevo en un momento."
    : "USCIS's case status service is temporarily unavailable. Please try again shortly.";
}

/** True for the same "good news" statuses statusTone() colors emerald —
 * shared so the round-44 share nudge fires on exactly the same signal as
 * the status pill, not a second, possibly-drifting definition of "positive". */
function isPositiveStatus(statusText: string): boolean {
  const s = statusText.toLowerCase();
  return s.includes("approved") || s.includes("card was delivered") || s.includes("naturalization oath");
}

/** Semantic color for a status pill, matched loosely against USCIS's own wording. */
function statusTone(statusText: string): { dot: string; text: string; bg: string } {
  const s = statusText.toLowerCase();
  if (isPositiveStatus(statusText)) {
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


/**
 * CW-39, Part A. Round 125 follow-up — Peter reversed the original "free on
 * every tier" call; the alert itself is now Plus-gated too, not just the
 * escalation tools that follow it (see isPlus check at the call site below).
 * See src/lib/escalation/stall-detector.ts for the (honestly approximate —
 * see its own comment) benchmark this uses.
 */
function StalledCaseCard({
  daysSinceLastUpdate,
  milestoneText,
  es,
}: {
  daysSinceLastUpdate: number;
  milestoneText: string;
  es: boolean;
}) {
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
            {es ? "Este caso parece retrasado" : "This case looks delayed"}
          </p>
          <p className="mt-1.5 text-sm text-foreground/90">
            {es ? (
              <>
                Han pasado {daysSinceLastUpdate} días desde &quot;{milestoneText}&quot; sin ninguna actualización más —
                más tiempo de lo típico para esta etapa. Inicia sesión y{" "}
                <Link href="/plus" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  actualiza a CaseWhy <PlusBadge size="sm" />
                </Link>{" "}
                para encontrar a tu representante y redactar una carta de seguimiento, o{" "}
                <Link href="/get-help" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  obtén ayuda de un profesional con licencia
                </Link>{" "}
                ahora.
              </>
            ) : (
              <>
                It&apos;s been {daysSinceLastUpdate} days since &quot;{milestoneText}&quot; with no further update —
                longer than typical for this stage. Sign in and{" "}
                <Link href="/plus" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  upgrade to CaseWhy <PlusBadge size="sm" />
                </Link>{" "}
                to find your representative and draft a follow-up letter, or{" "}
                <Link href="/get-help" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  get help from a licensed professional
                </Link>{" "}
                now.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ExplanationBox({
  explanation,
  receiptNumber,
  alreadyTracked,
  isPlus,
  es,
}: {
  explanation: CaseExplanation;
  receiptNumber: string;
  /** Round 66 — quick-ask links only render for a case the signed-in user
   * has actually tracked. `/ask`'s existing logic silently falls back to a
   * different tracked case for an unrecognized `?receipt=`, so an ad-hoc,
   * not-yet-tracked lookup would otherwise get misrouted to the wrong case
   * instead of the one this citation is actually about. */
  alreadyTracked: boolean;
  /** Round 125 — free tier gets the plain-language explanation in full
   * (honest and complete on "what does this mean, should I be worried"),
   * but not the deeper layer: next steps, cited policy background, and the
   * quick-ask links into the now-Plus-only chat. Both tiers already get the
   * same model call and the same relatedPolicies lookup (explainCaseStatus
   * is unchanged) — this gates DISPLAY only, not generation, since the cost
   * driver Peter's tightening is chat's unbounded per-question cost, not
   * this fixed, already-runs-for-everyone explanation call. */
  isPlus: boolean;
  es: boolean;
}) {
  // Round 80 — explanation.explanation / .nextSteps and each policy's
  // .title / .sourceTitle are AI-generated / KB content, Track 2 per the
  // task doc's explicit boundary — never translated here, only the box's
  // own static labels (headings, quick-ask button text, the disclaimer).
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
            {es ? "Qué significa esto" : "What this means"}
          </p>
          <p className="mt-1.5 text-sm text-foreground/90">
            {linkifyExplanation(explanation.explanation, explanation.relatedPolicies)}
          </p>
          {isPlus && explanation.nextSteps.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {explanation.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {/* New task, same day as round 29/30 — next-step bullets weren't
                      going through linkifyExplanation at all, so a step ending in
                      "...consult a licensed immigration attorney" rendered as
                      inert text even after the TERM_LINKS "attorney" entry was
                      added. Real gap, found by testing live rather than assumed
                      fixed by the term-links change alone. */}
                  <span>{linkifyExplanation(step, explanation.relatedPolicies)}</span>
                </li>
              ))}
            </ul>
          )}
          {isPlus && explanation.relatedPolicies.length > 0 && (
            <div className="mt-3 border-t border-brand-500/15 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {es ? "Antecedentes de política referenciados arriba" : "Policy background referenced above"}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {explanation.relatedPolicies.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span>
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {p.title}
                      </a>
                      <span className="text-muted"> — {p.sourceTitle}</span>
                    </span>
                    {alreadyTracked && (
                      <span className="flex shrink-0 gap-3 text-muted">
                        <Link
                          href={`/ask?link=${encodeURIComponent(`/policy/${p.id}`)}&ask=applies&receipt=${receiptNumber}${es ? "&lang=es" : ""}`}
                          className="underline decoration-dotted hover:text-foreground"
                        >
                          {es ? "¿Aplica a mi caso?" : "Does it apply to me?"}
                        </Link>
                        <Link
                          href={`/ask?link=${encodeURIComponent(`/policy/${p.id}`)}&ask=explains&receipt=${receiptNumber}${es ? "&lang=es" : ""}`}
                          className="underline decoration-dotted hover:text-foreground"
                        >
                          {es ? "¿Cómo aplica a mi caso?" : "How it applies to me?"}
                        </Link>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Round 125 — honest, not a dead end: only shown when there's
              genuinely more depth this case has and Plus would surface,
              never a generic "upgrade" nag on a case with nothing more to
              add. */}
          {!isPlus && (explanation.nextSteps.length > 0 || explanation.relatedPolicies.length > 0) && (
            <p className="mt-3 border-t border-brand-500/15 pt-3 text-xs text-muted">
              {explanation.relatedPolicies.length > 0 ? (
                es ? (
                  <>
                    CaseWhy <PlusBadge size="sm" /> agrega próximos pasos y respuestas instantáneas a &quot;¿Aplica a
                    mi caso?&quot; y &quot;¿Cómo aplica a mi caso?&quot;, fundamentadas en la política de USCIS
                    específica que coincide con este estado.
                  </>
                ) : (
                  <>
                    CaseWhy <PlusBadge size="sm" /> adds next steps and instant answers to &quot;Does it apply to
                    me?&quot; and &quot;How it applies to me?&quot;, grounded in the specific USCIS policy that
                    matches this status.
                  </>
                )
              ) : es ? (
                <>
                  CaseWhy <PlusBadge size="sm" /> agrega próximos pasos para este estado.
                </>
              ) : (
                <>
                  CaseWhy <PlusBadge size="sm" /> adds next steps for this status.
                </>
              )}
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            {es ? (
              <>
                Información general, no asesoría legal. Para orientación específica a tu caso, habla con un
                profesional con licencia —{" "}
                <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
                  obtén ayuda para encontrar uno
                </Link>
                .
              </>
            ) : (
              <>
                General information, not legal advice. For guidance specific to your case, talk to a
                licensed professional —{" "}
                <Link href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
                  get help finding one
                </Link>
                .
              </>
            )}
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
  isPlus,
  es,
}: {
  status: CaseStatus;
  explanation: CaseExplanation | null;
  es: boolean;
  /** Round 125 follow-up — stalled-case alert is now gated to Plus (Peter's
   * explicit call, reversing CW-39's original "free on every tier"
   * decision). Kept as its own prop rather than folded into `tracking`. */
  isPlus: boolean;
  /** Round 129 — case-status lookup is signed-in-only now, so this is never
   * null (there's no more signed-out anonymous-lookup path for it to be
   * null on — see DashboardPage's own sign-in gate above). */
  tracking: {
    alreadyTracked: boolean;
    trackedCaseId?: string;
    lastCheckedAt?: Date | null;
    canCheckNow: boolean;
    canDownloadReport: boolean;
    canUseVault: boolean;
    atCap: boolean;
    maxCases: number;
    /** Round 46 — true when adding another case will land as pending_review
     * rather than active (Plus, past the 10-case auto-approved band). */
    willQueueForReview: boolean;
    /** Round 46 — true when atCap is Plus's 25-case hard ceiling rather
     * than a flat-tier cap — changes TrackCaseButton's message to "contact
     * us" instead of "upgrade to Plus." */
    isPlusHardCeiling: boolean;
  };
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
          <p className="text-xs text-muted">{es ? `Actualizado ${status.modifiedDate}` : `Updated ${status.modifiedDate}`}</p>
        )}
      </div>

      {/* Round 114 follow-up — moved here, right under the status line, from
          further down the card. Found live before the demo: with the save
          action buried below the explanation/history, a user (or a USCIS
          reviewer) scanning the top of the card had no visible way to
          actually track what they just looked up. */}
      <div className="mt-3">
        <TrackCaseButton
          receiptNumber={status.receiptNumber}
          trackedCaseId={tracking.trackedCaseId}
          alreadyTracked={tracking.alreadyTracked}
          atCap={tracking.atCap}
          maxCases={tracking.maxCases}
          plusMaxCases={TIER_LIMITS.plus.maxCases}
          willQueueForReview={tracking.willQueueForReview}
          isPlusHardCeiling={tracking.isPlusHardCeiling}
          es={es}
        />
        {tracking.alreadyTracked && tracking.trackedCaseId && (
          <>
            <CheckNowButton
              trackedCaseId={tracking.trackedCaseId}
              lastCheckedAt={tracking.lastCheckedAt ?? null}
              canCheckNow={tracking.canCheckNow}
              es={es}
            />
            <DownloadReportLink
              receiptNumber={status.receiptNumber}
              canDownload={tracking.canDownloadReport}
              es={es}
            />
          </>
        )}
      </div>

      {explanation && (
        <ExplanationBox
          explanation={explanation}
          receiptNumber={status.receiptNumber}
          alreadyTracked={tracking?.alreadyTracked ?? false}
          isPlus={isPlus}
          es={es}
        />
      )}

      {/* Round 80 — statusDescription and each history entry's
          completed_text_en are USCIS's own raw words, Track 2, never
          translated. Round 130 — some notice types embed a literal HTML
          anchor tag in that raw text (see notice-text.tsx); renderNoticeText
          turns it into a real link instead of showing the tag characters. */}
      <p className="mt-4 text-sm leading-relaxed text-foreground/90">{renderNoticeText(status.statusDescription)}</p>

      {stall.isStalled && stall.milestoneText && isPlus && (
        <StalledCaseCard daysSinceLastUpdate={stall.daysSinceLastUpdate} milestoneText={stall.milestoneText} es={es} />
      )}

      {!stall.isStalled && isPositiveStatus(status.statusText) && <PositiveShareNudge es={es} />}

      {status.history.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">{es ? "Historial" : "History"}</p>
          <ol className="relative space-y-5 border-l border-border pl-5">
            {status.history.map((entry, i) => (
              <li key={i} className="relative text-sm">
                <span
                  className={`absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                    i === 0 ? "bg-brand-500" : "bg-border-strong"
                  }`}
                />
                <span className="block font-mono text-xs text-muted">{entry.date}</span>
                <span className="mt-0.5 block text-foreground/90">{renderNoticeText(entry.completed_text_en)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <DocumentVault trackedCaseId={tracking?.trackedCaseId} canUseVault={tracking?.canUseVault ?? false} es={es} />

      {tracking?.trackedCaseId && (
        <EscalationToolkit trackedCaseId={tracking.trackedCaseId} canUseToolkit={tracking?.canUseVault ?? false} es={es} />
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

/**
 * Round 46 — shown instead of a live status lookup for a case pending
 * review past Plus's 10-case auto-approved band. Deliberately never calls
 * getCaseStatus() for a pending case — that's the whole point of the gate,
 * not just the cron job's own polling.
 */
function PendingReviewCard({ receiptNumber, es }: { receiptNumber: string; es: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{receiptNumber}</p>
      <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
        {es ? "Revisión pendiente" : "Pending review"}
      </p>
      <p className="mt-1.5 text-sm text-foreground/90">
        {es
          ? "Estás rastreando más de 10 casos, así que este necesita una revisión rápida antes de que CaseWhy empiece a consultarlo — te enviaremos un correo dentro de 1 día hábil. Tus otros casos activos siguen actualizándose normalmente mientras tanto."
          : "You're tracking more than 10 cases, so this one needs a quick check before CaseWhy starts polling it — we'll email you within 1 business day. Your other active cases keep updating normally in the meantime."}
      </p>
    </div>
  );
}

/**
 * Round 128 — shown instead of a live status lookup once a free-tier
 * account's lifetime cap is reached and this is a genuinely new receipt
 * number (never tracked or looked up before on this account). Deliberately
 * never calls getCaseStatus() for a blocked receipt — that's the whole
 * point of the gate, not something enforced only when clicking "Track."
 */
function LifetimeCapCard({ receiptNumber, maxCases, es }: { receiptNumber: string; maxCases: number; es: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{receiptNumber}</p>
      <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
        {es ? "Límite de por vida alcanzado" : "Lifetime limit reached"}
      </p>
      <p className="mt-1.5 text-sm text-foreground/90">
        {es
          ? `Tu cuenta gratuita ya usó sus ${maxCases} búsquedas de por vida — rastrear o consultar el estado de un número de recibo, ambas cuentan. Este es un número de recibo nuevo para tu cuenta.`
          : `Your free account has already used its ${maxCases} lifetime lookups — tracking or checking a receipt number's status both count. This is a new receipt number for your account.`}
      </p>
      <Link href="/plus" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
        {es ? "Actualiza a CaseWhy Plus para más →" : "Upgrade to CaseWhy Plus for more →"}
      </Link>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ receipt?: string; lang?: string }>;
}) {
  const { receipt, lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const { data: session } = await auth.getSession();

  // Round 129 — case-status lookup is signed-in-only now, full stop. This
  // reverses a previously real, documented feature ("any receipt number can
  // be looked up without signing in") — Peter's explicit, deliberate call,
  // not a bug fix. Checked here, before anything else on this page, so a
  // signed-out request never reaches getCaseStatus() at all: not hidden by
  // conditional JSX further down, genuinely unreachable code for this
  // request (the real server-side enforcement point, not just a hidden
  // form in front of a still-live endpoint). Applies identically whether or
  // not ?receipt= is present, so a signed-out visitor landing directly on a
  // shared /dashboard?receipt=X link gets the same explanation, not a bare
  // redirect that leaks nothing about why — matching /ask's own signed-out
  // pattern (round 125) rather than /settings' hard redirect, since unlike
  // /settings this page is explicitly taking away behavior that used to
  // work, and that needs explaining, not just gating.
  if (!session?.user) {
    const signUpHref = receipt
      ? `/auth/sign-up?receipt=${encodeURIComponent(receipt)}${es ? "&lang=es" : ""}`
      : es
        ? "/auth/sign-up?lang=es"
        : "/auth/sign-up";
    const signInHref = receipt
      ? `/auth/sign-in?receipt=${encodeURIComponent(receipt)}${es ? "&lang=es" : ""}`
      : es
        ? "/auth/sign-in?lang=es"
        : "/auth/sign-in";
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <LanguageSwitcher es={es} href={localeToggleHref("/dashboard", { receipt }, es)} />
        <h1 className="text-2xl font-bold tracking-tight">{es ? "Tu caso" : "Your case"}</h1>
        <p className="mb-8 mt-2 text-muted">
          {es
            ? "Ingresa tu número de recibo de USCIS para ver su estado actual."
            : "Enter your USCIS receipt number to see its current status."}
        </p>
        <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-muted">
            {es ? (
              <>
                Consultar el estado de un caso ahora requiere una cuenta gratuita de CaseWhy —{" "}
                <Link href={signUpHref} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  crea una cuenta gratuita
                </Link>{" "}
                o{" "}
                <Link href={signInHref} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  inicia sesión
                </Link>{" "}
                para consultar tu caso.
              </>
            ) : (
              <>
                Looking up a case&apos;s status now requires a free CaseWhy account —{" "}
                <Link href={signUpHref} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  create a free account
                </Link>{" "}
                or{" "}
                <Link href={signInHref} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  sign in
                </Link>{" "}
                to check your case.
              </>
            )}
          </p>
        </div>
      </main>
    );
  }

  const trackedCasesList = await getTrackedCases(session.user.id);
  const details = await getSubscriptionDetails(session.user.id);
  const isPlus = details.tier === "plus";
  const maxCases = TIER_LIMITS[details.tier].maxCases;
  const effectiveMaxCases = details.effectiveMaxCases;
  const canCheckNow = isPlus;
  let lifetimeCount = 0;

  // An explicit ?receipt= search always wins (ad-hoc lookup); otherwise fall
  // back to the signed-in user's first tracked case, if any (CW-36: could
  // be one of several — see CaseSwitcher below for picking a different one).
  const receiptNumber = receipt?.trim() || trackedCasesList[0]?.receiptNumber || undefined;
  const trackedMatch = trackedCasesList.find((c) => c.receiptNumber === receiptNumber);
  const isPendingReview = trackedMatch?.status === "pending_review";

  // Round 128 — free tier's lifetime cap (3 distinct receipt numbers ever,
  // tracking or ad-hoc lookup together) is enforced here, before any USCIS
  // call — not just inside trackCase(). An ad-hoc `?receipt=` lookup used
  // to be completely unmetered even on a free account; this closes that gap
  // the same way trackCase() itself now does (see actions.ts). A receipt
  // already in the account's lifetime ledger (tracked or looked up before)
  // is always allowed — this only blocks a genuinely new receipt once all 3
  // lifetime slots are used, and untracking a case never frees one back up.
  let lifetimeCapReached = false;
  if (!isPlus) {
    if (receiptNumber && !isPendingReview) {
      const check = await checkAndRecordFreeLifetimeLookup(session.user.id, receiptNumber);
      lifetimeCapReached = !check.allowed;
      lifetimeCount = check.lifetimeCount;
    } else {
      lifetimeCount = await getFreeLifetimeLookupCount(session.user.id);
    }
  }

  let status: CaseStatus | null = null;
  let explanation: CaseExplanation | null = null;
  let errorMessage: string | null = null;

  // Round 46 — never fetch a live status for a case pending review; that's
  // the actual gate, not just the cron job's own polling. Round 128 — also
  // never fetch one once the free-tier lifetime cap blocks this receipt.
  if (receiptNumber && !isPendingReview && !lifetimeCapReached) {
    try {
      status = await getCaseStatus(receiptNumber);
      try {
        explanation = await explainCaseStatus(status);
      } catch {
        // Explanation is a nice-to-have — show the raw status even if the model call fails.
      }
      // Round 71 — this is the earliest real point a freshly-tracked case's
      // full USCIS history can be backfilled: the dashboard fetches a live
      // status the moment its owner looks at it, well before the next daily
      // cron run. Only for an actual tracked case, never an ad-hoc ?receipt=
      // lookup of something the account doesn't own. Safe to call on every
      // render — recordCaseHistory() dedupes on its own.
      if (trackedMatch) {
        try {
          await recordCaseHistory(trackedMatch.id, trackedMatch.caseType, receiptNumber, status);
          // Round 110 follow-up — real bug found live (Peter: tracked 5
          // cases, list showed "Not yet checked" on all of them despite
          // just looking each one up): recordCaseHistory() now persists
          // lastStatusText/lastCheckedAt, but trackedCasesList was already
          // fetched above, before this call, so its copy of trackedMatch
          // is stale for the rest of THIS render. trackedMatch is the same
          // object reference as the entry inside trackedCasesList (from
          // .find()), so mutating it here updates what <TrackedCasesList>
          // renders below without a second DB round-trip. Verified live:
          // without this, a case's very first check still showed "Not yet
          // checked" until the *next* page load.
          trackedMatch.lastStatusText = status.statusText;
          trackedMatch.lastCheckedAt = new Date();
        } catch {
          // Best-effort — never block rendering the dashboard on this.
        }
      }
    } catch (err) {
      errorMessage = err instanceof UscisApiError
        ? friendlyErrorMessage(err, es)
        : es
          ? "Algo salió mal al buscar tu caso. Por favor intenta de nuevo."
          : "Something went wrong looking up your case. Please try again.";
    }
  }

  // Round 46 — Plus is gated-unlimited: fully blocked only at the 25-case
  // hard ceiling, not at the 10-case auto-approved band (that band queues
  // for review instead, see willQueueForReview below). Round 128 — free
  // tier's cap is now the lifetime ledger check above, not a currently-
  // tracked-row count (lifetimeCapReached is only ever true here when
  // status was never fetched at all, so this mainly stays correct for any
  // future code path that reaches TrackCaseButton without going through
  // the lookup gate above).
  const atCap = isPlus
    ? trackedCasesList.length >= PLUS_HARD_CEILING_MAX_CASES
    : lifetimeCapReached;
  const willQueueForReview =
    isPlus &&
    trackedCasesList.length >= effectiveMaxCases &&
    trackedCasesList.length < PLUS_HARD_CEILING_MAX_CASES;

  const heading =
    trackedCasesList.length > 1 ? (es ? "Tus casos" : "Your cases") : es ? "Tu caso" : "Your case";
  // Round 114 follow-up — Peter, testing Plus, found no signal anywhere on
  // the dashboard of how many cases were tracked or which plan the
  // account was on. This line (free: "N of M tracked"; Plus: "N tracked ·
  // Plus") is the dashboard's own piece of that; Settings/plus carry the
  // rest (round 114 follow-up, Finding 2).
  // Round 128 — free tier's label now shows lifetime lookups used, not
  // currently-tracked count: those diverge the moment a case is untracked
  // (a currently-tracked count of 0 would otherwise misleadingly read as
  // "3 slots free" when the account may have already used its lifetime cap).
  const caseCountLabel = isPlus
    ? es
      ? `${trackedCasesList.length} caso${trackedCasesList.length === 1 ? "" : "s"} rastreado${trackedCasesList.length === 1 ? "" : "s"} · Plus`
      : `${trackedCasesList.length} case${trackedCasesList.length === 1 ? "" : "s"} tracked · Plus`
    : es
      ? `${lifetimeCount} de ${maxCases} búsquedas de por vida usadas`
      : `${lifetimeCount} of ${maxCases} lifetime lookups used`;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} href={localeToggleHref("/dashboard", { receipt }, es)} />
      <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
      {caseCountLabel && <p className="mt-1 text-xs font-medium text-muted">{caseCountLabel}</p>}
      <p className="mb-8 mt-2 text-muted">
        {es ? "Ingresa tu número de recibo de USCIS para ver su estado actual." : "Enter your USCIS receipt number to see its current status."}
      </p>

      <DashboardSearchArea
        receiptNumber={receiptNumber}
        trackedCaseCount={trackedCasesList.length}
        es={es}
        trackedCasesSlot={
          // Round 114 follow-up — always renders from the database, every
          // tracked case, independent of whether today's live refresh
          // below succeeds. Previously only shown (as a bare pill
          // switcher) when there was more than one case; found live
          // before the demo that a failed refresh left a signed-in user
          // with real tracked cases seeing nothing about them at all.
          // Stays outside the pending-skeleton area — this list doesn't
          // "load" per search, it's the account's own stable case list.
          trackedCasesList.length > 0 ? (
            <TrackedCasesList
              cases={trackedCasesList}
              activeReceiptNumber={receiptNumber}
              basePath="/dashboard"
              es={es}
            />
          ) : null
        }
      >
        {errorMessage && trackedMatch && (
          <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            {es
              ? `No pudimos actualizar desde USCIS en este momento — mostrando el último estado conocido arriba. Mensaje de USCIS: ${errorMessage}`
              : `Couldn't refresh from USCIS just now — showing the last known status above. USCIS's message: ${errorMessage}`}
          </p>
        )}

        <div className="mt-6">
          {isPendingReview && receiptNumber && <PendingReviewCard receiptNumber={receiptNumber} es={es} />}
          {lifetimeCapReached && receiptNumber && !isPendingReview && (
            <LifetimeCapCard receiptNumber={receiptNumber} maxCases={maxCases} es={es} />
          )}
          {status && (
            <StatusCard
              status={status}
              explanation={explanation}
              es={es}
              isPlus={isPlus}
              tracking={{
                alreadyTracked: trackedCasesList.some((c) => c.receiptNumber === status.receiptNumber),
                trackedCaseId: trackedCasesList.find((c) => c.receiptNumber === status.receiptNumber)?.id,
                lastCheckedAt: trackedCasesList.find((c) => c.receiptNumber === status.receiptNumber)?.lastCheckedAt,
                canCheckNow,
                canDownloadReport: canCheckNow,
                canUseVault: canCheckNow,
                atCap,
                maxCases: isPlus && atCap ? PLUS_HARD_CEILING_MAX_CASES : maxCases,
                willQueueForReview,
                isPlusHardCeiling: isPlus && atCap,
              }}
            />
          )}
          {errorMessage && !trackedMatch && <ErrorCard message={errorMessage} />}
          {!status && !isPendingReview && !errorMessage && !receiptNumber && trackedCasesList.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
              <p className="text-sm text-muted">
                {es ? "Ningún caso rastreado aún — ingresa un número de recibo arriba para comenzar." : "No case tracked yet — enter a receipt number above to get started."}
              </p>
            </div>
          )}
        </div>
      </DashboardSearchArea>
    </main>
  );
}
