import { findNewsItemById } from "@/lib/news/permalink";
import { extractArticle } from "@/lib/news/extract-article";
import { BackLink } from "@/components/BackLink";

// Round 63 — a real internal permalink for a news item, resolved by
// matching against the live feed (no new DB table, Peter's explicit
// choice). The real, stated tradeoff: this stops resolving once the story
// ages out of the live RSS/Federal Register window (days to a few weeks
// depending on source) — an honest "no longer available" state below,
// never a fabricated placeholder.

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const dynamic = "force-dynamic";

export default async function NewsItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await findNewsItemById(id);

  if (!item) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
        <BackLink href="/news" label="All news" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">This story is no longer available</h1>
        <p className="mt-2 text-muted">
          CaseWhy&apos;s news permalinks resolve by matching against the live news feed, not a
          permanent archive — this story has aged out of that window (typically days to a few
          weeks, depending on the source). It hasn&apos;t been deleted; it&apos;s just no longer in
          the live feed this page checks against.
        </p>
      </main>
    );
  }

  const article = await extractArticle(item.link);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <BackLink href="/news" label="All news" />

      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">
        {item.sourceName}
        {item.publishedAt && <span> · {formatDate(item.publishedAt)}</span>}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{item.title}</h1>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm">
        {article ? (
          <p className="whitespace-pre-wrap text-foreground/90">
            {article.text}
            {article.truncated && <span className="text-muted"> […]</span>}
          </p>
        ) : (
          <p className="text-muted">
            CaseWhy couldn&apos;t extract readable text from this article — read it at the
            original source below.
          </p>
        )}
      </div>

      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
      >
        Read original ↗
      </a>

      <p className="mt-6 text-xs text-muted">
        CaseWhy doesn&apos;t write or edit this coverage. Not legal advice.
      </p>
    </main>
  );
}
