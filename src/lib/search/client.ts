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

// Round 110 follow-up — live-verified via /admin/search's own example
// queries: "attorney florida" surfaced two USCIS news stories about
// attorneys committing fraud ahead of the actual "Find an immigration
// attorney" page; "I-485" surfaced I-131/I-751/I-129/I-821D FAQ answers
// above I-485's own content, because MiniSearch's default fuzzy (0.2)
// matching treats "I-485" and "I-131" as near-neighbors (same "I-\d\d\d"
// shape). Both fixed the same way: a boostDocument multiplier, not a
// fields/fuzzy config change, so unrelated queries are unaffected.
const FORM_NUMBER_RE = /\b([A-Z]-\d{2,4}[A-Z]?)\b/;

function extractFormNumber(text: string): string | null {
  const m = text.toUpperCase().match(FORM_NUMBER_RE);
  return m ? m[1] : null;
}

export async function searchContent(locale: "en" | "es", query: string): Promise<GroupedResults> {
  if (!query.trim()) return { answers: [], reference: [], pages: [] };
  const mini = await loadSearchIndex(locale);
  const queryFormNumber = extractFormNumber(query);

  const results = mini.search(query, {
    boostDocument: (_id, _term, storedFields) => {
      let boost = 1;
      const title = String(storedFields?.title ?? "");
      const url = String(storedFields?.url ?? "");

      if (queryFormNumber) {
        const titleFormNumber = extractFormNumber(title);
        if (titleFormNumber === queryFormNumber) {
          boost *= 4;
        } else if (titleFormNumber) {
          // A different form's own content, pulled in only because its
          // form number fuzzy-matches the query's -- demote so it
          // doesn't bury the form actually being searched for.
          boost *= 0.25;
        }
      }

      // News is time-sensitive/low-signal for a "find a form/process/
      // person" query -- demote relative to editorial and directory
      // content that's written to answer exactly that kind of question.
      if (storedFields?.type === "reference" && url.includes("/news/")) {
        boost *= 0.4;
      }

      return boost;
    },
  }) as unknown as IndexedDoc[];

  return {
    answers: results.filter((r) => r.type === "answer").slice(0, 5),
    reference: results.filter((r) => r.type === "reference").slice(0, 4),
    pages: results.filter((r) => r.type === "page").slice(0, 3),
  };
}
