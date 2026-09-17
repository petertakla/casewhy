"use client";

// Round 110 follow-up — generalizes FaqPageSearch (round 110 item 4) into
// a shared component for every list page, per that round's own spec that
// was never actually built out beyond /faq. Same underlying mechanism:
// query the real site-search index (round 110's own MiniSearch build,
// scripts/build-search-index.ts), scoped to this page's own entries by
// URL prefix, with a "Search all of CaseWhy" escape hatch into the full
// overlay for anything not on this page. This deliberately reuses the
// already-indexed content rather than a second, page-type-specific
// client-side array filter -- every target page's content (policy memos,
// updates posts, processing-times/visa-bulletin rows, news items) is
// already in that index with a real anchored URL, confirmed by reading
// scripts/build-search-index.ts directly before building this, not
// assumed from round 110's own description.

import { useEffect, useState } from "react";
import { searchContent, type IndexedDoc } from "@/lib/search/client";
import { openSiteSearch } from "@/lib/search/open-search-event";

export function PageFilter({
  basePath,
  placeholder,
  noMatchText,
  isSpanish,
}: {
  /** Every real result URL on this page starts with this (e.g. "/policy/", "/processing-times"). */
  basePath: string;
  placeholder: string;
  noMatchText: string;
  isSpanish: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndexedDoc[]>([]);
  const locale = isSpanish ? "es" : "en";

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchContent(locale, query).then((r) => {
      if (cancelled) return;
      const all = [...r.answers, ...r.reference, ...r.pages];
      setResults(all.filter((d) => d.url.startsWith(basePath)));
    });
    return () => {
      cancelled = true;
    };
  }, [query, locale, basePath]);

  return (
    <div data-page-filter className="mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
      {query.trim() && (
        <div className="mt-2 rounded-lg border border-border bg-surface p-2">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.id}>
                  <a href={r.url} className="block rounded-md px-2 py-1.5 text-sm text-brand-600 hover:bg-surface-2 hover:underline dark:text-brand-400">
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1.5 text-sm text-muted">{noMatchText}</p>
          )}
          <button
            type="button"
            onClick={() => openSiteSearch(query)}
            className="mt-1 block w-full rounded-md px-2 py-1.5 text-left text-sm font-semibold text-brand-600 hover:bg-surface-2 dark:text-brand-400"
          >
            {isSpanish ? "Buscar en todo CaseWhy →" : "Search all of CaseWhy →"}
          </button>
        </div>
      )}
    </div>
  );
}
