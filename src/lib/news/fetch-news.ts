// Round 14 — fetches and normalizes /news's six sources (src/lib/news/
// sources.ts) into one common shape. Each source is fetched independently
// and failures are isolated (Promise.allSettled) — one dead feed shouldn't
// blank the whole page, it should just quietly drop from the list with a
// note surfaced to the caller.

import { XMLParser } from "fast-xml-parser";
import { NEWS_SOURCES, type NewsSource } from "./sources";

export interface NewsItem {
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  publishedAt: Date | null;
}

// A real User-Agent, not a bare fetch default — USCIS's own feed has been
// seen 403 a plain server-side request without one (see sources.ts's note).
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// 15-minute cache — these feeds don't need to be fetched fresh on every
// single /news page view.
const REVALIDATE_SECONDS = 900;

interface RssItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
}

async function fetchRssSource(source: NewsSource): Promise<NewsItem[]> {
  const res = await fetch(source.url, {
    headers: FETCH_HEADERS,
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem | RssItem[] } };
  };
  const rawItems = parsed.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item): NewsItem => {
      const pubDate = typeof item.pubDate === "string" ? new Date(item.pubDate) : null;
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: typeof item.title === "string" ? item.title.trim() : "",
        link: typeof item.link === "string" ? item.link.trim() : "",
        publishedAt: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : null,
      };
    })
    .filter((item) => item.title && item.link);
}

interface FederalRegisterDocument {
  title?: unknown;
  html_url?: unknown;
  publication_date?: unknown;
}

async function fetchFederalRegisterSource(source: NewsSource): Promise<NewsItem[]> {
  const res = await fetch(source.url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const data = (await res.json()) as { results?: FederalRegisterDocument[] };
  const results = Array.isArray(data.results) ? data.results : [];

  return results
    .map((doc): NewsItem => {
      const publicationDate =
        typeof doc.publication_date === "string" ? new Date(doc.publication_date) : null;
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: typeof doc.title === "string" ? doc.title.trim() : "",
        link: typeof doc.html_url === "string" ? doc.html_url.trim() : "",
        publishedAt:
          publicationDate && !Number.isNaN(publicationDate.getTime()) ? publicationDate : null,
      };
    })
    .filter((item) => item.title && item.link);
}

/**
 * Fetches every enabled source and returns a merged, newest-first list.
 * `enabledSourceIds === null` means "no preferences row yet" — every
 * source is enabled by default (see disabledNewsSources's opt-out design).
 */
export async function fetchNews(
  enabledSourceIds: Set<string> | null
): Promise<{ items: NewsItem[]; failedSources: string[] }> {
  const sources = enabledSourceIds
    ? NEWS_SOURCES.filter((source) => enabledSourceIds.has(source.id))
    : NEWS_SOURCES;

  const failedSources: string[] = [];
  const settled = await Promise.allSettled(
    sources.map((source) =>
      source.type === "rss" ? fetchRssSource(source) : fetchFederalRegisterSource(source)
    )
  );

  // Real-world feeds sometimes list the same story twice (e.g. USCIS's own
  // feed cross-posts one story under two sections) — dedupe by link rather
  // than trusting each source to be internally unique.
  const seenLinks = new Set<string>();
  const items: NewsItem[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        if (seenLinks.has(item.link)) continue;
        seenLinks.add(item.link);
        items.push(item);
      }
    } else {
      failedSources.push(sources[i].name);
    }
  });

  items.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  return { items, failedSources };
}
