import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedUpdateBySlug, getUpdateBySlugFromDisk, type UpdatePost } from "@/lib/updates/updates";
import { POLICY_MEMOS } from "@/lib/kb/policy-memos";
import { BackLink } from "@/components/BackLink";
import { ShareButton } from "@/components/ShareButton";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type SearchParams = { preview?: string; lang?: string };

// Round 103 — the queue card previously showed only a title + one-
// sentence summary; the real 500-700 word article had no in-app way to
// read before approving. ?preview=1, admin-only, renders the unpublished
// post exactly as the public will see it once approved (round 93's own
// gate on getPublishedUpdateBySlug stays untouched) — same auth check
// src/app/admin/layout.tsx uses, not duplicated logic. Both `post` and
// `isPreview` are resolved once here and reused by both generateMetadata
// and the page component below, so the admin check only runs once per
// request despite Next.js calling both independently.
async function resolvePost(slug: string, searchParams: SearchParams): Promise<{ post: UpdatePost; isPreview: boolean } | null> {
  const published = await getPublishedUpdateBySlug(slug);
  if (published) return { post: published, isPreview: false };

  if (searchParams.preview !== "1") return null;
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) return null;

  const disk = await getUpdateBySlugFromDisk(slug);
  if (!disk) return null;
  return { post: disk, isPreview: true };
}

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const resolved = await resolvePost(slug, sp);
  if (!resolved) return { title: "Update not found | CaseWhy" };
  const { post, isPreview } = resolved;

  if (isPreview) {
    // No canonical, no description crafted for indexing — this page
    // should never rank or get crawled while unpublished.
    return { title: `${post.title} | CaseWhy`, robots: { index: false, follow: false } };
  }
  return {
    title: `${post.title} | CaseWhy`,
    description: post.summary,
    alternates: { canonical: `https://app.casewhy.com/updates/${slug}` },
  };
}

export default async function UpdatePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const resolved = await resolvePost(slug, sp);
  if (!resolved) notFound();
  const { post, isPreview } = resolved;
  // Round 105 — this used to be `isPreview && ...`, so the chrome (BackLink,
  // date format, Sources label, ShareButton) was only ever Spanish-aware on
  // an unpublished preview and silently reset to English the moment a post
  // went live. Chrome locale now follows the visitor on every post, live or
  // preview, the same as /updates' list page — only the post body itself
  // (post.content, post.title, post.summary) stays in whatever language
  // that post was actually written in.
  const isSpanish = await isSpanishLocale(sp.lang);

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
      {!isPreview && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
        </>
      )}

      {isPreview && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          {isSpanish ? (
            <>
              Vista previa — no publicado.{" "}
              <a href="/admin/marketing?channel=blog" className="font-semibold underline">
                Apruébelo en Administración › Marketing
              </a>{" "}
              para hacerlo público.
            </>
          ) : (
            <>
              Preview — not published.{" "}
              <a href="/admin/marketing?channel=blog" className="font-semibold underline">
                Approve it in Admin › Marketing
              </a>{" "}
              to make it public.
            </>
          )}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <BackLink href="/updates" label={isSpanish ? "Todas las actualizaciones" : "All updates"} />
        <LanguageSwitcher es={isSpanish} basePath={`/updates/${slug}`} params={{ preview: sp.preview }} variant="inline" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{post.title}</h1>
      {isSpanish && post.lang !== "es" && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">(en inglés)</p>
      )}
      <p className="mt-1 text-muted">
        {new Date(`${post.date}T00:00:00Z`).toLocaleDateString(isSpanish ? "es" : "en-US", {
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            {isSpanish ? "Fuentes" : "Sources"}
          </p>
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
                      <a
                        href={isSpanish ? `/policy/${memoId}?lang=es` : `/policy/${memoId}`}
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {isSpanish ? "Pregúntele a CaseWhy sobre esto →" : "Ask CaseWhy about this →"}
                      </a>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isPreview && (
        <div className="mt-8">
          <ShareButton url={url} title={post.title} text={post.summary} es={isSpanish} />
        </div>
      )}
    </main>
  );
}
