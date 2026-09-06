import { auth } from "@/lib/auth/server";
import { getEnabledNewsSourceIds } from "@/lib/settings/settings";
import { fetchNews } from "@/lib/news/fetch-news";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function NewsPage() {
  const { data: session } = await auth.getSession();
  const enabledSourceIds = await getEnabledNewsSourceIds(session?.user?.id ?? null);
  const { items, failedSources } = await fetchNews(enabledSourceIds);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Immigration news</h1>
      <p className="mb-8 mt-2 text-muted">
        USCIS announcements, federal rule changes, and immigration-law coverage from a curated set
        of sources.
        {session?.user && (
          <>
            {" "}
            Pick which sources show up here from{" "}
            <a href="/settings" className="text-brand-600 dark:text-brand-400 hover:underline">
              Settings
            </a>
            .
          </>
        )}
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">
          No stories available right now — check back shortly.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <a
              key={`${item.sourceId}-${item.link}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-surface p-5 hover:border-brand-500/50"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {item.sourceName}
                {item.publishedAt && <span> · {formatDate(item.publishedAt)}</span>}
              </p>
              <p className="mt-1.5 font-semibold text-foreground">{item.title}</p>
            </a>
          ))}
        </div>
      )}

      {failedSources.length > 0 && (
        <p className="mt-6 text-xs text-muted">
          Temporarily unavailable: {failedSources.join(", ")}.
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        CaseWhy doesn&apos;t write or edit this coverage — each story links to its original
        source. Not legal advice.
      </p>
    </main>
  );
}
