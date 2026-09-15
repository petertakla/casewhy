// Round 110 — client-side search over the build-time content index
// (public/search-index.{en,es}.json). Loaded lazily on first overlay
// open, not on every page load (the task doc's own instruction) -- a
// module-level cache means re-opening the overlay later in the same
// session reuses the already-built MiniSearch instance instead of
// re-fetching/re-indexing.

import MiniSearch from "minisearch";

// A trimmed, local copy of scripts/build-search-index.ts's SearchDoc
// shape -- kept as a plain type here (not imported from scripts/) so this
// client module, which Next bundles into the browser, never has an import
// path into the Node-only build script (fs/path, DB reads via
// getPublishedUpdates, etc.), even as a type-only import that should erase
// cleanly. Field-for-field identical; if that file's shape changes, this
// one needs the same edit in the same round, same convention as the FAQ
// data mirror.
export interface SearchDoc {
  type: "answer" | "reference" | "page";
  title: string;
  snippet: string;
  url: string;
  keywords: string;
  locale: "en" | "es";
}

export interface IndexedDoc extends SearchDoc {
  id: number;
}

// Accent folding so "boletin" finds "boletín", "tramite" finds "trámite"
// -- applied to both indexed terms and query terms via the same function,
// so they fold the same way on both sides.
function foldDiacritics(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const cache = new Map<string, Promise<MiniSearch<IndexedDoc>>>();

export function loadSearchIndex(locale: "en" | "es"): Promise<MiniSearch<IndexedDoc>> {
  const existing = cache.get(locale);
  if (existing) return existing;

  const promise = fetch(`/search-index.${locale}.json`)
    .then((res) => res.json() as Promise<SearchDoc[]>)
    .then((docs) => {
      const indexed: IndexedDoc[] = docs.map((d, id) => ({ ...d, id }));
      const mini = new MiniSearch<IndexedDoc>({
        fields: ["title", "keywords", "snippet"],
        storeFields: ["type", "title", "snippet", "url", "locale"],
        idField: "id",
        processTerm: (term) => foldDiacritics(term),
        searchOptions: {
          boost: { title: 3, keywords: 2, snippet: 1 },
          fuzzy: 0.2,
          prefix: true,
        },
      });
      mini.addAll(indexed);
      return mini;
    });

  cache.set(locale, promise);
  return promise;
}

export interface GroupedResults {
  answers: IndexedDoc[];
  reference: IndexedDoc[];
  pages: IndexedDoc[];
}

export async function searchContent(locale: "en" | "es", query: string): Promise<GroupedResults> {
  if (!query.trim()) return { answers: [], reference: [], pages: [] };
  const mini = await loadSearchIndex(locale);
  const results = mini.search(query) as unknown as IndexedDoc[];

  return {
    answers: results.filter((r) => r.type === "answer").slice(0, 5),
    reference: results.filter((r) => r.type === "reference").slice(0, 4),
    pages: results.filter((r) => r.type === "page").slice(0, 3),
  };
}
