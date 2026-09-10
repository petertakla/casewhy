// Round 63 — extracts real, readable article text for a news permalink's
// AI Q&A feature. The fetch target here is a URL CaseWhy's own live feed
// just produced from one of the six developer-curated NEWS_SOURCES domains
// — not user-supplied input — a materially lower-risk fetch than the
// original scope (an arbitrary pasted URL). Still real hygiene as defense
// in depth: a real timeout, a response-size cap, and the same User-Agent
// pattern fetch-news.ts already needs for sources that block a bare fetch.
//
// Originally built on @mozilla/readability + jsdom (the standard approach)
// but that failed in real production, not locally: jsdom's
// html-encoding-sniffer -> @exodus/bytes sub-dependency is ESM-only,
// require()'d as CJS, and genuinely incompatible with Vercel's server
// runtime (confirmed via a real deployed 500 and its actual log — "Error:
// require() of ES Module ... not supported" — not a bundling config issue;
// excluding jsdom from webpack bundling via serverExternalPackages did not
// fix it either). Replaced with the task's own authorized fallback: a
// simple, dependency-free script/style-stripped extraction. Cruder than
// Readability's boilerplate-removal (may include some nav/footer text on
// pages with unusual markup), but real, working, and stable in this
// runtime.

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

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#039": "'",
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&(#\d+|[a-z]+);/gi, (match, code) => {
      if (code.startsWith("#")) {
        const num = Number(code.slice(1));
        return Number.isFinite(num) ? String.fromCharCode(num) : match;
      }
      return HTML_ENTITIES[code.toLowerCase()] ?? match;
    });
}

/** Strips <script>/<style>/<noscript>/comments, then all remaining tags, decodes entities, and collapses whitespace — no DOM parser, plain string/regex work only. */
function stripToReadableText(html: string): string {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  return text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
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

  const text = stripToReadableText(html);
  if (!text || text.length < 200) return null;

  const truncated = text.length > MAX_EXTRACTED_CHARS;
  return {
    text: truncated ? text.slice(0, MAX_EXTRACTED_CHARS) : text,
    truncated,
  };
}
