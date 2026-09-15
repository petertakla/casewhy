"use client";

// Round 110 item 4 — the FAQ page's own search box: filters the page's
// own questions in place (client-side, same MiniSearch index everything
// else uses, just scoped to /faq or /es/faq entries), with a "Search all
// of CaseWhy" escape hatch into the full overlay for anything not on this
// page. Anchors from the shared slugify() convention make each question
// linkable, so a filtered result just scrolls the real page content into
// view instead of rendering a second copy of the answer.

import { useEffect, useState } from "react";
import { searchContent, type IndexedDoc } from "@/lib/search/client";
import { openSiteSearch } from "@/lib/search/open-search-event";

export function FaqPageSearch({ isSpanish }: { isSpanish: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndexedDoc[]>([]);
  const locale = isSpanish ? "es" : "en";
  const faqBasePath = isSpanish ? "/es/faq#" : "/faq#";

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchContent(locale, query).then((r) => {
      if (cancelled) return;
      setResults(r.answers.filter((d) => d.url.startsWith(faqBasePath)));
    });
    return () => {
      cancelled = true;
    };
  }, [query, locale, faqBasePath]);

  return (
    <div className="mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={isSpanish ? "Buscar en estas preguntas…" : "Search these questions…"}
        className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
      {query.trim() && (
        <div className="mt-2 rounded-lg border border-border bg-surface p-2">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.id}>
                  <a href={r.url.slice(faqBasePath.length - 1)} className="block rounded-md px-2 py-1.5 text-sm text-brand-600 hover:bg-surface-2 hover:underline dark:text-brand-400">
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1.5 text-sm text-muted">
              {isSpanish ? "Ninguna pregunta en esta página coincide." : "No questions on this page match."}
            </p>
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
