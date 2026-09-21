import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { BackLink } from "@/components/BackLink";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/site/metadata";

// Round 63 — a real internal permalink for a policy memo, so
// relatedPolicies links (CaseChat, the dashboard explanation) and the new
// "paste a link" chat feature have something internal to point to, instead
// of only ever linking straight out to sourceUrl. Same shell pattern as an
// entity permalink page (e.g. /legal-aid/[slug]) for visual consistency.
// No fetch — this is CaseWhy's own already-curated data.
//
// Round 73 — this content was previously invisible to search/AI-answer
// engines (login-adjacent, no metadata, no /policy list page linking to
// it). Added generateMetadata, a one-line direct-answer callout, and
// FAQPage schema (the summary/current-status pair genuinely already reads
// as Q&A) — see round73-seo-geo-foundation-task.md item 5.
//
// Round 105 — locale-aware, same round-82 same-route pattern as the list
// page. A memo without titleEs/summaryEs/currentStatusEs yet (added in a
// hurry, translation pending review) falls back to its English fields
// under Spanish chrome with an "(en inglés)" tag — never a silently
// half-translated page.

type SearchParams = { lang?: string };

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const memo = findPolicyMemoById(id);
  if (!memo) return { title: "Policy memo not found | CaseWhy" };
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const title = es && memo.titleEs ? memo.titleEs : memo.title;
  const summary = es && memo.summaryEs ? memo.summaryEs : memo.summary;
  const languages = {
    en: `https://app.casewhy.com/policy/${id}`,
    es: `https://app.casewhy.com/policy/${id}?lang=es`,
  };
  return pageMetadata(es ? `/policy/${id}?lang=es` : `/policy/${id}`, {
    title: es
      ? `${title}, Explicado | CaseWhy`
      : `${title}, Explained | CaseWhy`,
    description: firstSentence(summary),
    locale: es ? "es" : undefined,
    languages,
  });
}

export default async function PolicyMemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const memo = findPolicyMemoById(id);
  if (!memo) notFound();
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);

  const title = es && memo.titleEs ? memo.titleEs : memo.title;
  const summary = es && memo.summaryEs ? memo.summaryEs : memo.summary;
  const currentStatus =
    es && memo.currentStatusEs ? memo.currentStatusEs : memo.currentStatus;
  const untranslated = es && !memo.titleEs;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: es ? `¿Qué es ${title}?` : `What is ${title}?`,
        acceptedAnswer: { "@type": "Answer", text: summary },
      },
      {
        "@type": "Question",
        name: es
          ? `¿Cuál es el estado actual de ${title}?`
          : `What is the current status of ${title}?`,
        acceptedAnswer: { "@type": "Answer", text: currentStatus },
      },
    ],
  };

  // Round 93 — Part B's BreadcrumbList ask, added alongside the existing
  // FAQPage schema (untouched, per the task doc's explicit instruction).
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: es ? "Memorandos de política" : "Policy memos",
        item: es
          ? "https://app.casewhy.com/policy?lang=es"
          : "https://app.casewhy.com/policy",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: es
          ? `https://app.casewhy.com/policy/${memo.id}?lang=es`
          : `https://app.casewhy.com/policy/${memo.id}`,
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex items-center justify-between">
        <BackLink
          href="/policy"
          label={es ? "Todos los memorandos de política" : "All policy memos"}
        />
        <LanguageSwitcher
          es={es}
          basePath={`/policy/${memo.id}`}
          variant="inline"
        />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {title}
        {untranslated && (
          <span className="ml-2 text-sm font-normal text-muted">
            (en inglés)
          </span>
        )}
      </h1>
      {memo.memoNumber && <p className="mt-1 text-muted">{memo.memoNumber}</p>}

      <p className="mt-4 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {firstSentence(summary)}
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {memo.kind === "reference" ? (es ? "Tipo" : "Type") : es ? "Publicado" : "Published"}
          </p>
          <p className="mt-1">
            {memo.kind === "reference"
              ? es
                ? "Guía de referencia — no vinculada a un anuncio de política con fecha específica"
                : "Reference guide — not tied to a single dated policy announcement"
              : memo.datePublished}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Resumen" : "Summary"}
          </p>
          <p className="mt-1">{summary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Estado actual" : "Current status"}
          </p>
          <p className="mt-1">{currentStatus}</p>
        </div>
      </div>

      <a
        href={memo.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {es ? "Leer la fuente primaria ↗" : "Read the primary source ↗"}
      </a>
      <p className="mt-2 text-xs text-muted">
        {es ? "Fuente: " : "Source: "}
        {memo.sourceTitle}
      </p>

      {/* Round 127 — the same two quick-ask questions the dashboard's
          ExplanationBox offers for a matched policy citation, now also
          reachable straight from the memo's own public permalink page.
          No ?receipt= — /ask falls back to the signed-in user's first
          tracked case when one isn't specified, and a signed-out or
          free-tier visitor lands on /ask's own sign-in/Plus-upsell path,
          which is the point: this is one of the more concrete reasons to
          upgrade, worth surfacing everywhere a citation appears, not just
          inside an already-tracked case. */}
      <div className="mt-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          CaseWhy <PlusBadge size="sm" />
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {es
            ? "Si estás rastreando un caso, obtén una respuesta fundamentada en esta política específica y en los hechos de tu caso."
            : "If you're tracking a case, get an answer grounded in this specific policy and your case's own facts."}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={`/ask?link=${encodeURIComponent(`/policy/${memo.id}`)}&ask=applies${es ? "&lang=es" : ""}`}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {es ? "¿Aplica a mi caso?" : "Does it apply to me?"}
          </Link>
          <Link
            href={`/ask?link=${encodeURIComponent(`/policy/${memo.id}`)}&ask=explains${es ? "&lang=es" : ""}`}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {es ? "¿Cómo aplica a mi caso?" : "How it applies to me?"}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        {es ? (
          <>
            Información general de política, no un diagnóstico de ningún caso
            específico — la propia API de estado de casos de CaseWhy nunca
            confirma por qué un caso está retrasado. Para orientación específica
            sobre su caso, consulte a un abogado de inmigración con licencia.
          </>
        ) : (
          <>
            General policy background, not a diagnosis of any specific case —
            CaseWhy&apos;s own case status API never confirms why a case is
            delayed. For guidance specific to your case, talk to a licensed
            immigration attorney.
          </>
        )}
      </p>
    </main>
  );
}
