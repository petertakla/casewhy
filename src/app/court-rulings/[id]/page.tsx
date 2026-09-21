import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findCourtRulingById } from "@/lib/kb/court-rulings";
import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { BackLink } from "@/components/BackLink";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { pageMetadata } from "@/lib/site/metadata";

// Round 127 — a real internal permalink for a court ruling, same shell
// pattern as /policy/[id] (round 63) rather than a new one: generateMetadata,
// a one-line direct-answer callout, FAQPage + BreadcrumbList schema, and the
// same "Does it apply to me?" / "How it applies to me?" quick-ask links into
// /ask (src/lib/ai/link-context.ts resolves a /court-rulings/[id] link the
// same way it already resolves a /policy/[id] one).
//
// English-only this round, per the task doc's own explicit scoping call
// (matching round 120's admin-how-to precedent for this class of content) —
// the page's own static chrome is still bilingual, only the case-specific
// summary/currentStatus content has no Spanish variant yet.

type SearchParams = { lang?: string };

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ruling = findCourtRulingById(id);
  if (!ruling) return { title: "Court ruling not found | CaseWhy" };
  return pageMetadata(`/court-rulings/${id}`, {
    title: `${ruling.caseName}, Explained | CaseWhy`,
    description: firstSentence(ruling.summary),
    languages: {
      en: `https://app.casewhy.com/court-rulings/${id}`,
    },
  });
}

export default async function CourtRulingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const ruling = findCourtRulingById(id);
  if (!ruling) notFound();
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const relatedMemo = ruling.relatedPolicyMemoId ? findPolicyMemoById(ruling.relatedPolicyMemoId) : undefined;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What did the court decide in ${ruling.caseName}?`,
        acceptedAnswer: { "@type": "Answer", text: ruling.summary },
      },
      {
        "@type": "Question",
        name: `What is the current status of ${ruling.caseName}?`,
        acceptedAnswer: { "@type": "Answer", text: ruling.currentStatus },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Court rulings",
        item: "https://app.casewhy.com/court-rulings",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ruling.caseName,
        item: `https://app.casewhy.com/court-rulings/${ruling.id}`,
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
          href="/court-rulings"
          label={es ? "Todos los fallos judiciales" : "All court rulings"}
        />
        <LanguageSwitcher es={es} basePath={`/court-rulings/${ruling.id}`} variant="inline" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {ruling.caseName}
        {es && (
          <span className="ml-2 text-sm font-normal text-muted">(en inglés)</span>
        )}
      </h1>
      <p className="mt-1 text-muted">
        {ruling.court} · {ruling.citationOrDocket}
      </p>

      <p className="mt-4 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {firstSentence(ruling.summary)}
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Decidido" : "Decided"}
          </p>
          <p className="mt-1">{ruling.decidedDate}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Resumen" : "Summary"}
          </p>
          <p className="mt-1">{ruling.summary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {es ? "Estado actual" : "Current status"}
          </p>
          <p className="mt-1">{ruling.currentStatus}</p>
        </div>
      </div>

      {relatedMemo && (
        <p className="mt-4 text-sm text-muted">
          {es ? "Relacionado: " : "Related: "}
          <Link
            href={`/policy/${relatedMemo.id}`}
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {relatedMemo.title}
          </Link>
        </p>
      )}

      <a
        href={ruling.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        {es ? "Leer la fuente primaria ↗" : "Read the primary source ↗"}
      </a>
      <p className="mt-2 text-xs text-muted">
        {es ? "Fuente: " : "Source: "}
        {ruling.sourceTitle}
      </p>

      {/* Same treatment as /policy/[id] — see that page's own comment for
          the full reasoning. Guardrails for exactly this feature are in
          src/lib/ai/chat.ts's SYSTEM_INSTRUCTIONS (round 127 rule). */}
      <div className="mt-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          CaseWhy <PlusBadge size="sm" />
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {es
            ? "Si estás rastreando un caso, obtén una respuesta fundamentada en este fallo específico y en los hechos de tu caso."
            : "If you're tracking a case, get an answer grounded in this specific ruling and your case's own facts."}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={`/ask?link=${encodeURIComponent(`/court-rulings/${ruling.id}`)}&ask=applies${es ? "&lang=es" : ""}`}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {es ? "¿Aplica a mi caso?" : "Does it apply to me?"}
          </Link>
          <Link
            href={`/ask?link=${encodeURIComponent(`/court-rulings/${ruling.id}`)}&ask=explains${es ? "&lang=es" : ""}`}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {es ? "¿Cómo aplica a mi caso?" : "How it applies to me?"}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        {es ? (
          <>
            Información general sobre un fallo judicial público, no asesoría
            legal ni un diagnóstico de ningún caso específico. Para
            orientación específica sobre su caso, consulte a un abogado de
            inmigración con licencia.
          </>
        ) : (
          <>
            General information about a public court ruling, not legal advice
            or a diagnosis of any specific case. For guidance specific to your
            case, talk to a licensed immigration attorney.
          </>
        )}
      </p>
    </main>
  );
}
