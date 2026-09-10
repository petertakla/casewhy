// Round 63 — real internal permalinks for news items, lightweight, no new
// DB table (Peter's explicit choice, real tradeoff stated: a permalink
// stops resolving once its story ages out of the live feed window, days to
// a few weeks depending on source — not a bug when that happens, an
// accepted tradeoff for not standing up a persisted table).
//
// The id is derived deterministically from the item's own link
// (`${sourceId}-${sha256(link).slice(0,12)}`), so the same story always
// produces the same short, stable, copyable id, and a visitor can never
// forge an id that resolves to an arbitrary URL of their choosing — they'd
// need a hash collision, not a feasible attack.

import { createHash } from "crypto";
import { NEWS_SOURCES } from "./sources";
import { fetchNews, type NewsItem } from "./fetch-news";

export function newsItemId(item: Pick<NewsItem, "sourceId" | "link">): string {
  const hash = createHash("sha256").update(item.link).digest("hex").slice(0, 12);
  return `${item.sourceId}-${hash}`;
}

/**
 * Resolves a permalink id against ALL sources (not just one viewer's
 * enabled subset) — a shared permalink has to resolve the same for
 * whoever opens it, regardless of their own Settings preferences.
 */
export async function findNewsItemById(id: string): Promise<NewsItem | null> {
  const allSourceIds = new Set(NEWS_SOURCES.map((s) => s.id));
  const { items } = await fetchNews(allSourceIds);
  return items.find((item) => newsItemId(item) === id) ?? null;
}
