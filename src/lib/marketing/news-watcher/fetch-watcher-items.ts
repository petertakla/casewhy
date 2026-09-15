// Round 90 — fetches every WATCHER_SOURCES entry into one normalized
// shape. Same fast-xml-parser + real-User-Agent pattern as
// src/lib/community/rss-client.ts and src/lib/news/fetch-news.ts for the
// two feed-shaped source types; a small dependency-free regex scraper
// (matching this codebase's extract-article.ts precedent — jsdom/cheerio
// aren't used here, jsdom broke in production per that file's own note)
// for the one source with no feed, USCIS Policy Manual updates.
//
// Each source is fetched independently and a failure in one doesn't drop
// the others (Promise.allSettled), same isolation as poll-marketing-
// sources' own RSS_SOURCES loop.

import { XMLParser } from "fast-xml-parser";
import { WATCHER_SOURCES, type WatcherSource } from "./sources";

export interface WatcherItem {
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  rawSummary: string;
  publishedAt: Date | null;
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const MAX_AGE_DAYS = 7; // a 30-60 min poll only needs to look a week back to never miss a new item

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface RssItem {
  title?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
}

async function fetchRss(source: WatcherSource): Promise<WatcherItem[]> {
  const res = await fetch(source.url, { headers: FETCH_HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  const rawItems = parsed.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item): WatcherItem | null => {
      const url = typeof item.link === "string" ? item.link.trim() : "";
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!url || !title) return null;
      const pubDate = typeof item.pubDate === "string" ? new Date(item.pubDate) : null;
      return {
        sourceId: source.id,
        sourceName: source.name,
        url,
        title,
        rawSummary: typeof item.description === "string" ? stripHtml(item.description).slice(0, 2000) : "",
        publishedAt: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : null,
      };
    })
    .filter((item): item is WatcherItem => item !== null);
}

interface FederalRegisterDocument {
  title?: unknown;
  html_url?: unknown;
  publication_date?: unknown;
  abstract?: unknown;
}

async function fetchFederalRegister(source: WatcherSource): Promise<WatcherItem[]> {
  const res = await fetch(source.url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const data = (await res.json()) as { results?: FederalRegisterDocument[] };
  const results = Array.isArray(data.results) ? data.results : [];

  return results
    .map((doc): WatcherItem | null => {
      const url = typeof doc.html_url === "string" ? doc.html_url.trim() : "";
      const title = typeof doc.title === "string" ? doc.title.trim() : "";
      if (!url || !title) return null;
      const publicationDate = typeof doc.publication_date === "string" ? new Date(doc.publication_date) : null;
      return {
        sourceId: source.id,
        sourceName: source.name,
        url,
        title,
        rawSummary: typeof doc.abstract === "string" ? doc.abstract.slice(0, 2000) : "",
        publishedAt: publicationDate && !Number.isNaN(publicationDate.getTime()) ? publicationDate : null,
      };
    })
    .filter((item): item is WatcherItem => item !== null);
}

// USCIS Policy Manual updates page has no RSS feed (confirmed — see
// sources.ts's comment) but a stable, repeating markup block per update:
//   <div class="pm-updates">
//     <div class="pm-resource__update_header">TITLE</div>
//     ...<time datetime="ISO">...
//     ...<p>SUMMARY</p>...
//     <a href="PDF_URL" class="btn btn--anchor" ...>Read More</a>
// Verified directly against a real fetch of the page before writing this,
// not guessed at.
async function scrapePolicyManualUpdates(source: WatcherSource): Promise<WatcherItem[]> {
  const res = await fetch(source.url, { headers: FETCH_HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);
  const html = await res.text();

  const blocks = html.split('<div class="pm-updates">').slice(1);
  const items: WatcherItem[] = [];

  for (const block of blocks.slice(0, 30)) {
    const titleMatch = block.match(/pm-resource__update_header">([^<]+)</);
    const dateMatch = block.match(/<time datetime="([^"]+)"/);
    const summaryMatch = block.match(/field__item"><p>([\s\S]*?)<\/p>/);
    const urlMatch = block.match(/<a href="([^"]+)" class="btn btn--anchor"/);

    if (!titleMatch || !urlMatch) continue;
    const publishedAt = dateMatch ? new Date(dateMatch[1]) : null;

    items.push({
      sourceId: source.id,
      sourceName: source.name,
      url: urlMatch[1].trim(),
      title: stripHtml(titleMatch[1]).replace(/^POLICY ALERT\s*-\s*/i, ""),
      rawSummary: summaryMatch ? stripHtml(summaryMatch[1]).slice(0, 2000) : "",
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    });
  }

  return items;
}

export async function fetchWatcherItems(): Promise<{ items: WatcherItem[]; sourceErrors: Array<{ source: string; message: string }> }> {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const sourceErrors: Array<{ source: string; message: string }> = [];

  const settled = await Promise.allSettled(
    WATCHER_SOURCES.map((source) => {
      if (source.type === "rss") return fetchRss(source);
      if (source.type === "federal-register") return fetchFederalRegister(source);
      return scrapePolicyManualUpdates(source);
    })
  );

  const items: WatcherItem[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        // No publishedAt (rare) is kept rather than dropped -- better to
        // surface an item for Peter's own read than silently lose it over
        // a missing date field.
        if (item.publishedAt && item.publishedAt.getTime() < cutoff) continue;
        items.push(item);
      }
    } else {
      sourceErrors.push({
        source: WATCHER_SOURCES[i].name,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return { items, sourceErrors };
}
