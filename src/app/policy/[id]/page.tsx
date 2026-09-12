import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { BackLink } from "@/components/BackLink";

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
  const memo = findPolicyMemoById(id);
  if (!memo) return { title: "Policy memo not found | CaseWhy" };
  return {
    title: `${memo.title}, Explained | CaseWhy`,
    description: firstSentence(memo.summary),
  };
}

export default async function PolicyMemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memo = findPolicyMemoById(id);
  if (!memo) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${memo.title}?`,
        acceptedAnswer: { "@type": "Answer", text: memo.summary },
      },
      {
        "@type": "Question",
        name: `What is the current status of ${memo.title}?`,
        acceptedAnswer: { "@type": "Answer", text: memo.currentStatus },
      },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BackLink href="/policy" label="All policy memos" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{memo.title}</h1>
      {memo.memoNumber && <p className="mt-1 text-muted">{memo.memoNumber}</p>}

      <p className="mt-4 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {firstSentence(memo.summary)}
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Published</p>
          <p className="mt-1">{memo.datePublished}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Summary</p>
          <p className="mt-1">{memo.summary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Current status</p>
          <p className="mt-1">{memo.currentStatus}</p>
        </div>
      </div>

      <a
        href={memo.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        Read the primary source ↗
      </a>
      <p className="mt-2 text-xs text-muted">Source: {memo.sourceTitle}</p>

      <p className="mt-6 text-xs text-muted">
        General policy background, not a diagnosis of any specific case — CaseWhy&apos;s own case
        status API never confirms why a case is delayed. For guidance specific to your case, talk
        to a licensed immigration attorney.
      </p>
    </main>
  );
}
