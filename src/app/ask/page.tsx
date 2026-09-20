import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getTrackedCases } from "@/app/dashboard/actions";
import { CaseSwitcher } from "@/app/dashboard/CaseSwitcher";
import { getCaseStatus, UscisApiError } from "@/lib/uscis/client";
import { getSubscriptionTier } from "@/lib/billing/tier";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { CaseChat, type QuickAskKind } from "./CaseChat";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";

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
  const langHref = localeToggleHref("/ask", { receipt, link, ask }, es);
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
        <LanguageSwitcher es={es} href={langHref} />
        <h1 className="text-2xl font-bold tracking-tight">{es ? "Hacer una pregunta" : "Ask a question"}</h1>
        <p className="mb-8 mt-2 text-muted">
          {es
            ? "Una forma conversacional de preguntar sobre tu caso, fundamentada en la base de conocimiento de políticas de CaseWhy."
            : "A conversational way to ask about your case, grounded in CaseWhy's policy knowledge base."}
        </p>
        <EmptyState>
          {es ? (
            <>
              Chatear sobre tu caso específico rastreado es una función de CaseWhy Plus —{" "}
              <Link href="/auth/sign-in?lang=es" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                inicia sesión
              </Link>{" "}
              y suscríbete para empezar. ¿Solo tienes una pregunta general sobre políticas de USCIS?{" "}
              <Link href="/get-help/ask?lang=es" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Pregúntale a CaseWhy
              </Link>{" "}
              ahora mismo, sin necesidad de iniciar sesión.
            </>
          ) : (
            <>
              Chatting about your own specific tracked case is a CaseWhy Plus feature —{" "}
              <Link href="/auth/sign-in" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                sign in
              </Link>{" "}
              and subscribe to start. Just have a general USCIS policy question?{" "}
              <Link href="/get-help/ask" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Ask CaseWhy
              </Link>{" "}
              right now, no sign-in needed.
            </>
          )}
        </EmptyState>
      </main>
    );
  }

  // Round 125 — AI chat is now a Plus-only feature (paywall tightening,
  // Peter's direct call), not a metered free perk. Checked here, before the
  // tracked-cases lookup, on purpose: with the old ordering a free user with
  // no tracked cases yet was told "track a case, then come back here to ask
  // about it" -- a real broken promise, since even once they did that
  // they'd still hit the paywall. A free user now sees the Plus upsell
  // immediately regardless of whether they have a case tracked. The
  // /api/chat route still enforces this server-side too (defense in depth,
  // same "layout is UX, the real boundary is elsewhere" pattern as round
  // 98's admin gate).
  const tier = await getSubscriptionTier(session.user.id);
  if (tier !== "plus") {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <LanguageSwitcher es={es} href={langHref} />
        <h1 className="text-2xl font-bold tracking-tight">{es ? "Hacer una pregunta" : "Ask a question"}</h1>
        <div className="mt-6 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-8 text-center">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            CaseWhy <PlusBadge size="sm" />
          </p>
          <p className="mt-2 text-sm text-muted">
            {es ? (
              <>
                El chat de IA es una función de CaseWhy Plus — cada respuesta está fundamentada en la propia
                política de USCIS y en el recibo específico que estás siguiendo, no un chatbot genérico
                adivinando.
              </>
            ) : (
              <>
                AI chat is a CaseWhy Plus feature — every answer is grounded in USCIS&apos;s own policy and
                your specific tracked receipt, not a generic chatbot guessing.
              </>
            )}
          </p>
          <Link
            href="/plus#ai-chat"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            {es ? "Ver CaseWhy Plus" : "See CaseWhy Plus"}
          </Link>
          {/* Round 125 follow-up (Cloud review) — a free user landing here
              loses case-specific chat entirely; without this they're told
              "no" with nowhere else to go. /get-help/ask is the separate,
              always-free, no-sign-in-required general policy chat (3
              questions, lifetime cap per IP, not case-grounded) -- a real
              answer to "what does this mean" even without Plus, just not
              one that knows this specific case. */}
          <p className="mt-3 text-xs text-muted">
            {es ? (
              <>
                ¿Solo tienes una pregunta general sobre políticas de USCIS?{" "}
                <Link href="/get-help/ask?lang=es" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  Pregúntale a CaseWhy
                </Link>{" "}
                sin necesidad de iniciar sesión.
              </>
            ) : (
              <>
                Just have a general USCIS policy question?{" "}
                <Link href="/get-help/ask" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  Ask CaseWhy
                </Link>{" "}
                without signing in.
              </>
            )}
          </p>
        </div>
      </main>
    );
  }

  const trackedCasesList = await getTrackedCases(session.user.id);
  if (trackedCasesList.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <LanguageSwitcher es={es} href={langHref} />
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
      <LanguageSwitcher es={es} href={langHref} />
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
