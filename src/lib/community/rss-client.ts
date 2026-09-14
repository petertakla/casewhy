// Round 85 — RSS polling for the community-forum monitor. Same
// fast-xml-parser + real-User-Agent pattern as src/lib/news/fetch-news.ts.
//
// Checked live before including anything, per the task doc's own "don't
// scrape a forum that doesn't offer one" instruction:
//   - immigration.com/rss.xml: real feed, genuinely active (items from
//     Dec 2025, Aug 2025, Jul 2025 confirmed present alongside older ones
//     as of this check) -> included below.
//   - VisaJourney: every URL tried (forum RSS paths, even the bare
//     homepage) returns a hard 403 to a plain server-side request — same
//     bot-blocking posture as USCIS's own site (see processing-times.ts's
//     note). No accessible feed exists to build against.
//   - Trackitt: connection failure (no response at all) — the site
//     appears to be down, not just feed-less.
// Both are left out of RSS_SOURCES below rather than guessed at; if either
// comes back online or exposes a real feed later, add it here the same
// way immigration.com is defined.

import { XMLParser } from "fast-xml-parser";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface RssThread {
  url: string;
  title: string;
  bodyText: string;
  sourceName: string;
  createdAt: Date;
}

interface RssSource {
  id: string;
  name: string;
  url: string;
}

export const RSS_SOURCES: RssSource[] = [
  { id: "immigration-com", name: "Immigration.com News", url: "https://www.immigration.com/rss.xml" },
];

interface RssItem {
  title?: unknown;
  link?: unknown;
  description?: unknown;
  pubDate?: unknown;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRssThreads(source: RssSource, maxAgeDays = 3): Promise<RssThread[]> {
  const res = await fetch(source.url, { headers: FETCH_HEADERS, next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  const rawItems = parsed.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  return items
    .map((item): RssThread | null => {
      const pubDate = typeof item.pubDate === "string" ? new Date(item.pubDate) : null;
      const url = typeof item.link === "string" ? item.link.trim() : "";
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!url || !title) return null;
      return {
        url,
        title,
        bodyText: typeof item.description === "string" ? stripHtml(item.description).slice(0, 2000) : "",
        sourceName: source.name,
        createdAt: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : new Date(0),
      };
    })
    .filter((item): item is RssThread => item !== null && item.createdAt.getTime() >= cutoff);
}
