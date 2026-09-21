import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import Link from "next/link";
import { COURT_RULINGS } from "@/lib/kb/court-rulings";
import { ShareButton } from "@/components/ShareButton";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageFilter } from "@/components/PageFilter";

// Round 127 — list page for the court-rulings KB, same round-73 pattern as
// /policy/page.tsx: a public, indexable mirror of curated content that also
// powers in-app quick-ask answers, not new research on its own.
//
// English-only content this round (see [id]/page.tsx's own comment), but
// the page chrome itself is still bilingual, matching every other public
// page's baseline.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const languages = {
    en: "https://app.casewhy.com/court-rulings",
    es: "https://app.casewhy.com/court-rulings?lang=es",
  };
  return es
    ? pageMetadata("/court-rulings?lang=es", {
        title: "Fallos Judiciales de Inmigración, Explicados | CaseWhy",
        description:
          "Explicaciones en lenguaje sencillo de fallos judiciales reales y significativos sobre inmigración que pueden afectar un caso pendiente de USCIS.",
        locale: "es",
        languages,
      })
    : pageMetadata("/court-rulings", {
        title: "Immigration Court Rulings, Explained | CaseWhy",
        description:
          "Plain-language explanations of real, significant immigration-related court decisions that can affect a pending USCIS case.",
        languages,
      });
}

function formatDate(iso: string, es: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    es ? "es" : "en-US",
    { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  );
}

export default async function CourtRulingsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const rulings = [...COURT_RULINGS].sort((a, b) => (a.decidedDate < b.decidedDate ? 1 : -1));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} basePath="/court-rulings" />
      <h1 className="text-2xl font-bold tracking-tight">
        {es ? "Fallos judiciales de inmigración, explicados" : "Immigration court rulings, explained"}
      </h1>
      <p className="mb-2 mt-2 text-muted">
        {es
          ? "Fallos judiciales reales y significativos sobre inmigración que pueden explicar plausiblemente por qué un caso pendiente parece retrasado o afectado — escritos una vez, en lenguaje sencillo, para que cualquiera los lea, sin estar vinculados al caso de ninguna persona en particular."
          : "Real, significant immigration-related court decisions that can plausibly explain why a pending case looks delayed or affected — written once, in plain language, for anyone to read, not tied to any specific person's case."}
      </p>
      <p className="mb-8 text-xs text-muted">
        {es
          ? "Información general, no asesoría legal ni un diagnóstico de ningún caso específico. Para orientación específica sobre su propio caso, consulte a un abogado de inmigración con licencia."
          : "General information, not legal advice or a diagnosis of any specific case. For guidance specific to your own case, talk to a licensed immigration attorney."}
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/court-rulings"
          title="CaseWhy — Immigration court rulings, explained"
          text={
            es
              ? "Explicaciones en lenguaje sencillo de fallos judiciales reales sobre inmigración, gratis, con CaseWhy."
              : "Plain-language explanations of real immigration court rulings, for free, with CaseWhy."
          }
          es={es}
        />
      </div>

      <PageFilter
        basePath="/court-rulings/"
        placeholder={es ? "Filtrar estos fallos…" : "Filter these rulings…"}
        noMatchText={
          es
            ? "Ningún fallo en esta página coincide."
            : "No rulings on this page match."
        }
        isSpanish={es}
      />

      <div className="space-y-4">
        {rulings.map((ruling) => (
          <Link
            key={ruling.id}
            href={`/court-rulings/${ruling.id}`}
            className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {formatDate(ruling.decidedDate, es)} · {ruling.court}
            </p>
            <p className="mt-1.5 font-semibold text-foreground">
              {ruling.caseName}
              {es && <span className="font-normal text-muted"> (en inglés)</span>}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
