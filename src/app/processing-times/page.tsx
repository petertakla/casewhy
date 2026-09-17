import type { Metadata } from "next";
import {
  PROCESSING_TIMES,
  PROCESSING_TIMES_AS_OF,
  PROCESSING_TIMES_SOURCE_URL,
  FIELD_OFFICE_ONLY_FORMS,
  VISA_BULLETIN_TIED_NOTE,
  OFFICE_LOCATOR_URL,
  ASC_LOCATOR_URL,
  hasStaleEntry,
} from "@/lib/kb/processing-times";
import Link from "next/link";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { localeToggleHref } from "@/lib/i18n/locale-href";
import { ShareButton } from "@/components/ShareButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageFilter } from "@/components/PageFilter";

// Round 83 — was a static `export const metadata`, so every visitor got
// the English title/description regardless of `?lang=es`, and there was
// no hreflang link between the two language states at all. Converted to
// generateMetadata() so it can read the same lang signal the page body
// already does. Query-param-based hreflang annotations (rather than a
// separate path like /es/get-help) are explicitly supported by Google's
// own multilingual-sites guidance, as long as each language state
// consistently self-references — that's what the `alternates.languages`
// block below does.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  return es
    ? {
        title: "Tiempos de Procesamiento de USCIS por Formulario | CaseWhy",
        description:
          "Las propias estimaciones de tiempo de procesamiento publicadas por USCIS para N-400, I-485, I-765, I-130, y otros tipos de caso comunes, siempre actualizadas.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/processing-times",
            es: "https://app.casewhy.com/processing-times?lang=es",
          },
        },
      }
    : {
        title: "USCIS Processing Times by Form | CaseWhy",
        description:
          "USCIS's own published processing-time estimates for N-400, I-485, I-765, I-130, and other common case types, kept current.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/processing-times",
            es: "https://app.casewhy.com/processing-times?lang=es",
          },
        },
      };
}

// Round 73 — direct-answer block + FAQPage schema, so the page's own
// existing "80% of cases..." explanation (previously only at the very
// bottom) is extractable near the top for search snippets/AI answers too.
// See round73-seo-geo-foundation-task.md item 3-4.
const PERCENTILE_FAQ_ANSWER =
  "USCIS bases each processing-time figure on how long it took to complete 80% of cases over the past six months. It's a reference point, not a guarantee — individual cases vary, and the figure updates as USCIS republishes its own data.";

// Round 83 — the FAQPage schema below was hardcoded English regardless of
// `?lang=es`, even though the visible on-page answer this schema mirrors
// was already translated. A Spanish visitor's rich-result/AI-answer
// snippet would have shown English text pulled from a Spanish page.
const PERCENTILE_FAQ_ANSWER_ES =
  "USCIS basa cada cifra de tiempo de procesamiento en cuánto tiempo tomó completar el 80% de los casos durante los últimos seis meses. Es un punto de referencia, no una garantía — los casos individuales varían, y la cifra se actualiza a medida que USCIS vuelve a publicar sus propios datos.";

// Round 80 follow-up — this page has no session/auth logic (pure reference
// content from in-memory constants), so it was static (prerendered) before
// this round. Reading the locale via cookies() (isSpanishLocale) makes it
// force-dynamic instead — a real, deliberate tradeoff (loses CDN caching)
// accepted here because the underlying data is cheap in-memory constants,
// not a DB/API call, so the per-request cost is trivial, and consistency
// with the rest of the app's locale experience (this page is a real nav
// link) outweighs the caching loss for a low-traffic reference page.
export const dynamic = "force-dynamic";

export default async function ProcessingTimesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const months = PROCESSING_TIMES.map((e) => e.percentile80Months);
  const minMonths = Math.min(...months);
  const maxMonths = Math.max(...months);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: es ? "es" : "en",
    mainEntity: [
      {
        "@type": "Question",
        name: es
          ? "¿Qué significa '80% de los casos completados dentro de X meses'?"
          : "What does '80% of cases completed within X months' mean?",
        acceptedAnswer: { "@type": "Answer", text: es ? PERCENTILE_FAQ_ANSWER_ES : PERCENTILE_FAQ_ANSWER },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LanguageSwitcher es={es} href={localeToggleHref("/processing-times", {}, es)} />
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Tiempos de procesamiento" : "Processing times"}</h1>
      <p className="mb-2 mt-2 text-muted">
        {es
          ? "Las propias estimaciones de tiempo de procesamiento publicadas por USCIS, para los tipos de caso que CaseWhy rastrea."
          : "USCIS's own published processing-time estimates, for the case types CaseWhy tracks."}
      </p>
      <p className="mb-2 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {es
          ? `Las propias estimaciones publicadas por USCIS para los tipos de caso que CaseWhy rastrea actualmente van de ${minMonths} a ${maxMonths} meses para que el 80% de los casos se completen, dependiendo del formulario y la oficina.`
          : `USCIS's own published estimates for the case types CaseWhy tracks currently range from ${minMonths} to ${maxMonths} months for 80% of cases to complete, depending on form and office.`}
      </p>
      <p className={`text-xs text-muted ${hasStaleEntry() ? "mb-2" : "mb-8"}`}>
        {es ? "Al " : "As of "}
        {PROCESSING_TIMES_AS_OF} —{" "}
        <a
          href={PROCESSING_TIMES_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          {es ? "consulta la herramienta oficial para tu formulario y oficina exactos" : "check the official tool for your exact form and office"}
        </a>
      </p>

      {hasStaleEntry() && (
        <p className="mb-8 text-xs text-muted">
          {es
            ? "Algunas cifras tienen más de un mes — consulta la herramienta de USCIS para lo más reciente."
            : "Some figures are more than a month old — check the USCIS tool for the latest."}
        </p>
      )}

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/processing-times"
          title="CaseWhy — Processing times"
          text={es ? "Consulta estimaciones de tiempo de procesamiento de USCIS para tipos de caso reales, gratis, con CaseWhy." : "See USCIS processing-time estimates for real case types, for free, with CaseWhy."}
          es={es}
        />
      </div>

      <PageFilter
        basePath="/processing-times"
        placeholder={es ? "Filtrar por formulario u oficina…" : "Filter by form or office…"}
        noMatchText={es ? "Ningún formulario en esta página coincide." : "No forms on this page match."}
        isSpanish={es}
      />

      <div className="space-y-4">
        {PROCESSING_TIMES.map((entry) => (
          <div key={entry.id} id={entry.id} className="scroll-mt-20 rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {entry.formType} <span className="font-normal text-muted">— {entry.categoryLabel}</span>
              </p>
              <p className="text-xs text-muted">{entry.office}</p>
            </div>
            <p className="mt-2 text-sm">
              {es ? "El 80% de los casos se completaron en" : "80% of cases completed within"}{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {entry.percentile80Months}{" "}
                {es
                  ? entry.percentile80Months === 1 ? "mes" : "meses"
                  : entry.percentile80Months === 1 ? "month" : "months"}
              </span>
            </p>
            {entry.note && <p className="mt-2 text-xs text-muted">{entry.note}</p>}
            <p className="mt-2 text-xs text-muted">
              {es ? "Al " : "As of "}
              {entry.asOf}
            </p>
          </div>
        ))}
      </div>

      <div id="field-office-only" className="mt-8 scroll-mt-20 rounded-xl border border-dashed border-border-strong p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "No mostrado arriba — específico a la oficina, sin cifra nacional" : "Not shown above — office-specific, no national figure"}
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          {FIELD_OFFICE_ONLY_FORMS.map((f) => (
            <li key={`${f.formType}-${f.categoryLabel ?? "default"}`}>
              <span className="font-semibold">{f.formType}</span>
              {f.categoryLabel && <span className="text-muted"> — {f.categoryLabel}</span>}
              <p className="mt-0.5 text-muted">{f.note}</p>
              {f.locatorUrl && (
                <a
                  href={f.locatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  {(es ? f.locatorLabelEs : f.locatorLabel) ?? f.locatorLabel} →
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{VISA_BULLETIN_TIED_NOTE}</p>
        <Link href={es ? "/visa-bulletin?lang=es" : "/visa-bulletin"} className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {es ? "Ver el boletín de visas →" : "See the visa bulletin →"}
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {es ? "Encuentra tu oficina específica" : "Find your specific office"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {es ? (
            <>
              Las cifras de arriba son números nacionales. Para un formulario que depende de la oficina local
              (N-400, I-485 basado en familia) o para encontrar dónde se realiza una cita de biometría,
              busca tu propia oficina directamente en el sitio de USCIS — es la fuente oficial y actual, y
              no algo que CaseWhy mantenga una copia de:
            </>
          ) : (
            <>
              The figures above are national numbers. For a field-office-dependent form (N-400,
              family-based I-485) or to find where a biometrics appointment happens, look up your own
              office directly on USCIS&apos;s site — it&apos;s the current, official source and not
              something CaseWhy keeps a copy of:
            </>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a
            href={OFFICE_LOCATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            {es ? "Encuentra tu oficina local" : "Find your field office"}
          </a>
          <a
            href={ASC_LOCATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            {es ? "Encuentra tu Centro de Apoyo para Solicitudes" : "Find your Application Support Center"}
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        {es
          ? "Estos son puntos de referencia, no una garantía — USCIS basa cada cifra en cuánto tiempo tomó completar el 80% de los casos durante los últimos seis meses, y los casos individuales varían."
          : "These are reference points, not a guarantee — USCIS bases each figure on how long it took to complete 80% of cases over the past six months, and individual cases vary."}
      </p>
    </main>
  );
}
