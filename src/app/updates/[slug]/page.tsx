import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedUpdateBySlug } from "@/lib/updates/updates";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";
import { BackLink } from "@/components/BackLink";
import { ShareButton } from "@/components/ShareButton";

// Round 93 task doc, Part A — "Sourcing block on every post — same
// two-link pattern as the app's policy citations (official source +
// 'Ask CaseWhy about this →' when a POLICY_MEMOS id matches)." A post's
// source is matched to a policy memo by exact sourceUrl, the only stable
// join key available (frontmatter sources[] are just title/url pairs,
// with no memo id of their own).
function matchingPolicyMemoId(sourceUrl: string): string | undefined {
  return POLICY_MEMOS.find((memo) => memo.sourceUrl === sourceUrl)?.id;
}

// Round 93 — permalink page for a single /updates post. Same shell
// pattern as /policy/[id] (BackLink, generateMetadata, JSON-LD script
// tag), but content renders from Markdown (react-markdown) instead of a
// few fixed string fields, and visibility is gated by
// getPublishedUpdateBySlug returning null for anything not yet approved
// in the round 89 queue — notFound() either way, so an unapproved slug
// looks identical to one that doesn't exist.

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedUpdateBySlug(slug);
  if (!post) return { title: "Update not found | CaseWhy" };
  return {
    title: `${post.title} | CaseWhy`,
    description: post.summary,
    alternates: { canonical: `https://app.casewhy.com/updates/${slug}` },
  };
}

export default async function UpdatePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedUpdateBySlug(slug);
  if (!post) notFound();

  const url = `https://app.casewhy.com/updates/${slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: post.lang,
    url,
    author: { "@type": "Organization", name: "CaseWhy", url: "https://app.casewhy.com" },
    publisher: { "@type": "Organization", name: "CaseWhy", url: "https://app.casewhy.com" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Updates", item: "https://app.casewhy.com/updates" },
      { "@type": "ListItem", position: 2, name: post.title, item: url },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BackLink href="/updates" label="All updates" />

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{post.title}</h1>
      <p className="mt-1 text-muted">
        {new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })}
      </p>

      <p className="mt-4 rounded-lg border border-border-strong bg-surface-2 p-3 text-sm text-foreground/90">
        {firstSentence(post.summary)}
      </p>

      <div className="update-content mt-6 space-y-4 text-sm leading-relaxed text-foreground/90">
        <ReactMarkdown
          components={{
            h2: (props) => <h2 className="mt-6 text-lg font-bold tracking-tight text-foreground" {...props} />,
            h3: (props) => <h3 className="mt-5 font-semibold text-foreground" {...props} />,
            p: (props) => <p {...props} />,
            ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
            ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
            a: (props) => (
              <a
                className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
            em: (props) => <em className="text-muted" {...props} />,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {post.sources.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Sources</p>
          <ul className="space-y-2 text-sm">
            {post.sources.map((source) => {
              const memoId = matchingPolicyMemoId(source.url);
              return (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {source.title} ↗
                  </a>
                  {memoId && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={`/policy/${memoId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                        Ask CaseWhy about this →
                      </a>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <ShareButton url={url} title={post.title} text={post.summary} />
      </div>
    </main>
  );
}
