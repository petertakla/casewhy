// Round 63 — extracts real, readable article text for a news permalink's
// AI Q&A feature. The fetch target here is a URL CaseWhy's own live feed
// just produced from one of the six developer-curated NEWS_SOURCES domains
// — not user-supplied input — a materially lower-risk fetch than the
// original scope (an arbitrary pasted URL). Still real hygiene as defense
// in depth: a real timeout, a response-size cap, and the same User-Agent
// pattern fetch-news.ts already needs for sources that block a bare fetch.

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const FETCH_TIMEOUT_MS = 9000;
const MAX_RESPONSE_BYTES = 1.5 * 1024 * 1024; // ~1.5MB
const MAX_EXTRACTED_CHARS = 6000;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface ExtractedArticle {
  text: string;
  truncated: boolean;
}

async function fetchWithLimits(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) return res.text();

    const decoder = new TextDecoder();
    let result = "";
    let bytesRead = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_RESPONSE_BYTES) {
        controller.abort();
        break;
      }
      result += decoder.decode(value, { stream: true });
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches and extracts readable article text. Returns null if extraction
 * fails or returns too little usable text — a real, expected outcome for
 * some sources, per the task's own note; callers must show an honest
 * "couldn't read this article" state, never fabricate content.
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  let html: string;
  try {
    html = await fetchWithLimits(url);
  } catch {
    return null;
  }

  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const text = article?.textContent?.trim();
    if (!text || text.length < 200) return null;

    const truncated = text.length > MAX_EXTRACTED_CHARS;
    return {
      text: truncated ? text.slice(0, MAX_EXTRACTED_CHARS) : text,
      truncated,
    };
  } catch {
    return null;
  }
}
