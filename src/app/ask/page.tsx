import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "@/app/dashboard/actions";
import { CaseSwitcher } from "@/app/dashboard/CaseSwitcher";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { CaseChat, type QuickAskKind } from "./CaseChat";

export const dynamic = "force-dynamic";

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

function parseAutoAsk(value: string | undefined): QuickAskKind | undefined {
  return value === "applies" || value === "explains" ? value : undefined;
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ receipt?: string; link?: string; ask?: string; lang?: string }>;
}) {
  const { receipt, link, ask, lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  // Round 66 — a quick-ask link only auto-fires when both parts of the pair
  // are present and well-formed; a bare `?link=` with no `?ask=` (or vice
  // versa) is treated as if neither were there rather than guessed at.
  const initialLinkedUrl = link?.trim() || undefined;
  const initialAutoAsk = parseAutoAsk(ask);
  const autoAskProps =
    initialLinkedUrl && initialAutoAsk ? { initialLinkedUrl, initialAutoAsk } : {};
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{es ? "Hacer una pregunta" : "Ask a question"}</h1>
        <p className="mb-8 mt-2 text-muted">
          {es
            ? "Una forma conversacional de preguntar sobre tu caso, fundamentada en la base de conocimiento de políticas de CaseWhy."
            : "A conversational way to ask about your case, grounded in CaseWhy's policy knowledge base."}
        </p>
        <EmptyState>
          {es ? (
            <>
              <Link href="/auth/sign-in?lang=es" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Inicia sesión
              </Link>{" "}
              y rastrea un caso para empezar a hacer preguntas sobre él.
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Sign in
              </Link>{" "}
              and track a case to start asking questions about it.
            </>
          )}
        </EmptyState>
      </main>
    );
  }

  const trackedCasesList = await getTrackedCases(session.user.id);
  if (trackedCasesList.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{es ? "Hacer una pregunta" : "Ask a question"}</h1>
        <p className="mb-8 mt-2 text-muted">
          {es
            ? "Una forma conversacional de preguntar sobre tu caso, fundamentada en la base de conocimiento de políticas de CaseWhy."
            : "A conversational way to ask about your case, grounded in CaseWhy's policy knowledge base."}
        </p>
        <EmptyState>
          {es ? (
            <>
              <Link href="/dashboard?lang=es" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Rastrea un caso en tu panel
              </Link>{" "}
              primero, y luego regresa aquí para preguntar sobre él.
            </>
          ) : (
            <>
              <Link href="/dashboard" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Track a case on your dashboard
              </Link>{" "}
              first, then come back here to ask about it.
            </>
          )}
        </EmptyState>
      </main>
    );
  }

  // An explicit ?receipt= naming one of this user's own tracked cases wins
  // (CW-36: could have several); otherwise default to the first active one
  // (round 46: never default to a pending-review case — same reasoning as
  // the dashboard, chat needs a real status to ground itself in).
  const requested = receipt?.trim();
  const activeCases = trackedCasesList.filter((c) => c.status === "active");
  const receiptNumber =
    requested && trackedCasesList.some((c) => c.receiptNumber === requested)
      ? requested
      : (activeCases[0] ?? trackedCasesList[0]).receiptNumber;
  const isPendingReview = trackedCasesList.find((c) => c.receiptNumber === receiptNumber)?.status === "pending_review";

  let statusText: string | null = null;
  let formType: string | null = null;
  let errorMessage: string | null = null;
  if (!isPendingReview) {
    try {
      const status = await getCaseStatus(receiptNumber);
      statusText = status.statusText;
      formType = status.formType;
    } catch (err) {
      errorMessage =
        err instanceof UscisApiError
          ? es
            ? "No pudimos comunicarnos con el servicio de estado de casos de USCIS en este momento. Por favor intenta de nuevo en un momento."
            : "Couldn't reach USCIS's case status service right now. Please try again shortly."
          : es
            ? "Algo salió mal al buscar tu caso."
            : "Something went wrong looking up your case.";
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Hacer una pregunta" : "Ask a question"}</h1>
      <p className="mb-8 mt-2 text-muted">
        {es
          ? "Una forma conversacional de preguntar sobre tu caso, fundamentada en la base de conocimiento de políticas de CaseWhy."
          : "A conversational way to ask about your case, grounded in CaseWhy's policy knowledge base."}
      </p>

      {trackedCasesList.length > 1 && (
        <CaseSwitcher cases={trackedCasesList} activeReceiptNumber={receiptNumber} basePath="/ask" es={es} />
      )}

      {isPendingReview ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {es
              ? "Este caso está en revisión pendiente (estás rastreando más de 10 casos) — el chat se abre una vez que sea aprobado. Elige un caso diferente arriba, o vuelve a revisar después de que tengas noticias nuestras."
              : "This case is pending review (you're tracking more than 10 cases) — chat opens up once it's approved. Pick a different case above, or check back after you hear from us."}
          </p>
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      ) : (
        <>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
            {formType} · {statusText}
          </p>
          <CaseChat
            key={receiptNumber}
            receiptNumber={receiptNumber}
            statusText={statusText ?? undefined}
            formType={formType ?? undefined}
            es={es}
            {...autoAskProps}
          />
        </>
      )}
    </main>
  );
}
