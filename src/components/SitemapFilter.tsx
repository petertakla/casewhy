"use client";

// Round 110 follow-up — /sitemap's own list of pages doesn't have real
// content to search via the site-search index (each entry is just a
// name/link, already fully known server-side), so unlike PageFilter
// (which queries the search index), this filters the already-computed
// section/entry list directly, client-side. Renders the list itself too
// (not just the input), replacing what was previously two separate
// inline .map() blocks in /sitemap and /es/sitemap.

import { useState } from "react";
import Link from "next/link";

export interface SitemapEntry {
  href: string;
  label: string;
  external?: boolean;
  /** Round 97/99 — Spanish page linking to an English-only target. */
  englishOnly?: boolean;
}

export interface SitemapSection {
  name: string;
  entries: SitemapEntry[];
}

export function SitemapFilter({
  sections,
  placeholder,
  noMatchText,
  externalLabelSuffix,
}: {
  sections: SitemapSection[];
  placeholder: string;
  noMatchText: string;
  /** e.g. " ↗" — appended to an external entry's label. */
  externalLabelSuffix: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = q
    ? sections
        .map((s) => ({ ...s, entries: s.entries.filter((e) => e.label.toLowerCase().includes(q)) }))
        .filter((s) => s.entries.length > 0)
    : sections;

  return (
    <div data-page-filter>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-8 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />

      {q && filtered.length === 0 ? (
        <p className="text-sm text-muted">{noMatchText}</p>
      ) : (
        <div className="space-y-8">
          {filtered.map((section) => (
            <div key={section.name}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{section.name}</h2>
              <ul className="space-y-2 text-sm">
                {section.entries.map((entry) =>
                  entry.external ? (
                    <li key={entry.href}>
                      <a href={entry.href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                        {entry.label}
                        {externalLabelSuffix}
                      </a>
                      {entry.englishOnly && <span className="text-muted"> (en inglés)</span>}
                    </li>
                  ) : (
                    <li key={entry.href}>
                      <Link href={entry.href} className="text-brand-600 hover:underline dark:text-brand-400">
                        {entry.label}
                      </Link>
                      {entry.englishOnly && <span className="text-muted"> (en inglés)</span>}
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
