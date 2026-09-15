import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedUpdates, type UpdatePost } from "@/lib/updates/updates";
import { ShareButton } from "@/components/ShareButton";
import { isSpanishLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Round 93 — the public list page for CaseWhy's editorial blog. Same
// list+permalink shape as /policy and /news, but the posts rendered here
// are filtered to only those whose round 89 marketing_queue row has
// reached posted/edited_posted (see getPublishedUpdates) — a post's
// content file can exist in the repo well before it's actually live.
//
// Round 105 — the chrome (this page's own strings) is locale-aware on the
// round-82 same-route pattern, same as /news and /policy. Posts themselves
// are NOT translated — each keeps its own `lang` frontmatter (round 93),
// per the task doc's explicit rule that Spanish posts are written
// natively, not machine-translated. In Spanish mode, Spanish posts sort
// first, then English posts carry the site's standard "(en inglés)" tag.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  return es
    ? {
        title: "Actualizaciones | CaseWhy",
        description:
          "Explicaciones en lenguaje sencillo de cómo funciona realmente el procesamiento de USCIS, escritas por el equipo que construye CaseWhy.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/updates",
            es: "https://app.casewhy.com/updates?lang=es",
          },
        },
      }
    : {
        title: "Updates | CaseWhy",
        description:
          "Plain-language explanations of how USCIS processing actually works, written by the team building CaseWhy.",
        alternates: {
          languages: {
            en: "https://app.casewhy.com/updates",
            es: "https://app.casewhy.com/updates?lang=es",
          },
        },
      };
}

function formatDate(iso: string, es: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(es ? "es" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function sortForLocale(posts: UpdatePost[], es: boolean): UpdatePost[] {
  if (!es) return posts;
  return [...posts].sort((a, b) => Number(b.lang === "es") - Number(a.lang === "es"));
}

export default async function UpdatesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const es = await isSpanishLocale(lang);
  const posts = sortForLocale(await getPublishedUpdates(), es);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} basePath="/updates" />
      <h1 className="text-2xl font-bold tracking-tight">{es ? "Actualizaciones" : "Updates"}</h1>
      <p className="mb-8 mt-2 text-muted">
        {es
          ? "Explicaciones en lenguaje sencillo de cómo funciona realmente el procesamiento de USCIS — qué significa un estado, cómo leer el boletín de visas, cuándo escalar — escritas una vez, para que cualquiera las lea."
          : "Plain-language explanations of how USCIS processing actually works — what a status means, how to read the Visa Bulletin, when to escalate — written once, for anyone to read."}
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <ShareButton
          url="https://app.casewhy.com/updates"
          title="CaseWhy — Updates"
          text={
            es
              ? "Explicaciones en lenguaje sencillo de cómo funciona realmente el procesamiento de USCIS, de CaseWhy."
              : "Plain-language explanations of how USCIS processing actually works, from CaseWhy."
          }
          es={es}
        />
        <a
          href="/updates/feed.xml"
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {es ? "Fuente RSS" : "RSS feed"}
        </a>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">{es ? "Aún no hay publicaciones — vuelva a revisar pronto." : "No posts yet — check back soon."}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/updates/${post.slug}`}
              className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {formatDate(post.date, es)}
                {es && post.lang !== "es" && <span> · (en inglés)</span>}
              </p>
              <p className="mt-1.5 font-semibold text-foreground">{post.title}</p>
              <p className="mt-1 text-sm text-muted">{post.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
