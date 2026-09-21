import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import Link from "next/link";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";
import { ShareButton } from "@/components/ShareButton";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageFilter } from "@/components/PageFilter";

// Round 73 — the public, indexable mirror of the policy-memo knowledge
// base that already powers CaseWhy's in-app, per-case explanations
// (CW-31). This is a publishing step, not new research: same
// POLICY_MEMOS array, same list+permalink shape as /news, just given a
// real list page so the permalinks (previously only reachable from inside
// a signed-in case explanation) are actually discoverable. See
// round73-seo-geo-foundation-task.md item 5.
//
// Round 105 — locale-aware on the round-82 same-route pattern, same as
// /news and /updates. Each memo's titleEs/summaryEs/currentStatusEs
// (policy-memos.ts) supplies the Spanish content; a memo without one yet
// falls back to its English title with an "(en inglés)" tag, per the task
// doc's explicit rule — never a silent English card under Spanish chrome.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const languages = {
    en: "https://app.casewhy.com/policy",
    es: "https://app.casewhy.com/policy?lang=es",
  };
  return es
    ? pageMetadata("/policy?lang=es", {
        title: "Memorandos de Política de USCIS, Explicados | CaseWhy",
        description:
          "Explicaciones en lenguaje sencillo de los principales memorandos de política, cambios de reglas y fallos judiciales de USCIS que pueden afectar un caso de inmigración pendiente.",
        locale: "es",
        languages,
      })
    : pageMetadata("/policy", {
        title: "USCIS Policy Memos, Explained | CaseWhy",
        description:
          "Plain-language explanations of major USCIS policy memos, rule changes, and court rulings that can affect a pending immigration case.",
        languages,
      });
}

function formatDate(iso: string, es: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    es ? "es" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

export default async function PolicyIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  // Round 126 follow-up — split by kind rather than one chronological list.
  // Sorting reference entries (no real datePublished) into the same
  // datePublished-descending sort as real dated memos was what produced
  // the misleading "several from Jan 2026, then a cliff to 2021" read —
  // see the kind field's own comment in policy-memos.ts.
  const datedMemos = POLICY_MEMOS.filter((m) => m.kind === "memo").sort((a, b) =>
    a.datePublished < b.datePublished ? 1 : -1,
  );
  const referenceEntries = [...POLICY_MEMOS]
    .filter((m) => m.kind === "reference")
    .sort((a, b) => (es && a.titleEs ? a.titleEs : a.title).localeCompare(es && b.titleEs ? b.titleEs : b.title));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} basePath="/policy" />
      <h1 className="text-2xl font-bold tracking-tight">
        {es
          ? "Memorandos de política de USCIS, explicados"
          : "USCIS policy memos, explained"}
      </h1>
      <p className="mb-2 mt-2 text-muted">
        {es
          ? "Cambios de política, memorandos y fallos judiciales importantes de USCIS que pueden explicar plausiblemente por qué un caso pendiente parece retrasado o afectado — escritos una vez, en lenguaje sencillo, para que cualquiera los lea, sin estar vinculados al caso de ninguna persona en particular."
          : "Major USCIS policy changes, memos, and court rulings that can plausibly explain why a pending case looks delayed or affected — written once, in plain language, for anyone to read, not tied to any specific person's case."}
      </p>
      <p className="mb-8 text-xs text-muted">
        {es
          ? "Información general de política, no un diagnóstico de ningún caso específico. Para orientación específica sobre su propio caso, consulte a un abogado de inmigración con licencia."
          : "General policy background, not a diagnosis of any specific case. For guidance specific to your own case, talk to a licensed immigration attorney."}
      </p>

      <div className="mb-8">
        <ShareButton
          url="https://app.casewhy.com/policy"
          title="CaseWhy — USCIS policy memos, explained"
          text={
            es
              ? "Explicaciones en lenguaje sencillo de los principales cambios de política de USCIS, gratis, con CaseWhy."
              : "Plain-language explanations of major USCIS policy changes, for free, with CaseWhy."
          }
          es={es}
        />
      </div>

      <PageFilter
        basePath="/policy/"
        placeholder={es ? "Filtrar estos memorandos…" : "Filter these memos…"}
        noMatchText={
          es
            ? "Ningún memorando en esta página coincide."
            : "No memos on this page match."
        }
        isSpanish={es}
      />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
        {es ? "Memorandos y fallos con fecha" : "Dated memos & rulings"}
      </h2>
      <div className="mb-10 space-y-4">
        {datedMemos.map((memo) => {
          const title = es && memo.titleEs ? memo.titleEs : memo.title;
          const untranslated = es && !memo.titleEs;
          return (
            <Link
              key={memo.id}
              href={es ? `/policy/${memo.id}?lang=es` : `/policy/${memo.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {formatDate(memo.datePublished, es)}
                {memo.memoNumber && <span> · {memo.memoNumber}</span>}
              </p>
              <p className="mt-1.5 font-semibold text-foreground">
                {title}
                {untranslated && (
                  <span className="font-normal text-muted"> (en inglés)</span>
                )}
              </p>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
        {es ? "Guías de referencia por formulario" : "Form reference guides"}
      </h2>
      <p className="mb-4 text-xs text-muted">
        {es
          ? "Cómo funciona cada formulario en general — no vinculado a un anuncio de política con fecha específica."
          : "How each form generally works — not tied to a single dated policy announcement."}
      </p>
      <div className="space-y-4">
        {referenceEntries.map((memo) => {
          const title = es && memo.titleEs ? memo.titleEs : memo.title;
          const untranslated = es && !memo.titleEs;
          return (
            <Link
              key={memo.id}
              href={es ? `/policy/${memo.id}?lang=es` : `/policy/${memo.id}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {es ? "Referencia" : "Reference"}
                {memo.memoNumber && <span> · {memo.memoNumber}</span>}
              </p>
              <p className="mt-1.5 font-semibold text-foreground">
                {title}
                {untranslated && (
                  <span className="font-normal text-muted"> (en inglés)</span>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
