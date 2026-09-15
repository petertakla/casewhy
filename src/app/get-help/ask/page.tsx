import type { Metadata } from "next";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AnonymousChat } from "./AnonymousChat";

// Round 60 Phase B — a genuinely zero-friction anonymous question-answering
// surface: no sign-in, no tracked case. Deliberately its own route/
// component, not /ask (the case-grounded chat), which requires sign-in and
// a real tracked case — see src/lib/get-help/anonymous-chat.ts for what's
// in and out of scope here.
//
// Round 105 — locale-aware on the round-82 same-route pattern (?lang=es +
// sticky cookie), same as /news. The AI itself now answers in the
// visitor's own language too (see anonymous-chat.ts's SYSTEM_INSTRUCTIONS
// and the Spanish variant of the deterministic court/removal redirect) —
// this was genuinely the one page where "Ask CaseWhy" meant "ask CaseWhy,
// in English" no matter what language a visitor wrote in.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  return es
    ? {
        title: "Pregúntele a CaseWhy — Preguntas Gratis de Inmigración | CaseWhy",
        description:
          "Haga una pregunta general sobre procesos, estados o términos de USCIS — gratis, sin necesidad de iniciar sesión, basado en la base de conocimiento de políticas de CaseWhy.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/get-help/ask",
            es: "https://app.casewhy.com/get-help/ask?lang=es",
          },
        },
      }
    : {
        title: "Ask CaseWhy — Free Immigration Questions Answered | CaseWhy",
        description:
          "Ask a general question about USCIS processes, statuses, or terms — free, no sign-in required, grounded in CaseWhy's curated policy knowledge base.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/get-help/ask",
            es: "https://app.casewhy.com/get-help/ask?lang=es",
          },
        },
      };
}

export default async function GetHelpAskPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <LanguageSwitcher es={es} basePath="/get-help/ask" />
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Pregúntele a CaseWhy" : "Ask CaseWhy"}</h1>
      <p className="mt-2 text-muted">
        {es ? (
          <>
            Gratis, sin necesidad de iniciar sesión. Haga una pregunta general sobre procesos,
            estados o términos de USCIS — basado en la propia base de conocimiento de políticas de
            CaseWhy, no en el caso de ninguna persona en particular.
          </>
        ) : (
          <>
            Free, no sign-in required. Ask a general question about USCIS processes, statuses, or
            terms — grounded in CaseWhy&apos;s own policy knowledge base, not in any specific
            person&apos;s case.
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-muted">
        {es ? (
          <>
            No es asesoría legal. Para algo específico de su propio caso, inicie sesión y
            rastréelo — o encuentre un profesional con licencia en la página{" "}
            <a href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Obtener ayuda
            </a>
            .
          </>
        ) : (
          <>
            Not legal advice. For anything specific to your own case, sign in and track it — or
            find a licensed professional on the{" "}
            <a href="/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Get Help
            </a>{" "}
            page.
          </>
        )}
      </p>

      <div className="mt-6">
        <AnonymousChat es={es} />
      </div>
    </main>
  );
}
