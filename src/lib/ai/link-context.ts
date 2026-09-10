// Round 63 Part 4 — resolves a pasted link to CaseWhy's own already-vetted
// content, server-side, never trusting client-supplied content for what a
// link "contains." A pasted link only ever resolves to one of two things:
// a policy memo (direct KB lookup, no fetch) or a news item (the same
// feed-matched-and-extracted content the /news/[id] permalink itself
// shows) — never an arbitrary external URL. This is the actual security
// boundary for the whole feature: no fetch of user-supplied input, ever.

import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { findNewsItemById } from "@/lib/news/permalink";
import { extractArticle } from "@/lib/news/extract-article";

export interface LinkedContent {
  kind: "policy" | "news";
  title: string;
  text: string;
}

export interface LinkResolutionError {
  error: string;
}

const POLICY_PATH_RE = /^\/policy\/([^/?#]+)\/?$/;
const NEWS_PATH_RE = /^\/news\/([^/?#]+)\/?$/;

/** Extracts a pathname from either a full URL or a bare path string, without throwing on malformed input. */
function extractPathname(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    // Only CaseWhy's own app domain (or localhost, for local/dev testing) —
    // never resolve a path-shaped match against an arbitrary host.
    if (url.hostname !== "app.casewhy.com" && url.hostname !== "localhost") return null;
    return url.pathname;
  } catch {
    return null;
  }
}

export async function resolveLinkedContent(
  input: string
): Promise<LinkedContent | LinkResolutionError> {
  const pathname = extractPathname(input);
  if (!pathname) {
    return { error: "Paste a link to one of CaseWhy's policy or news pages." };
  }

  const policyMatch = pathname.match(POLICY_PATH_RE);
  if (policyMatch) {
    const memo = findPolicyMemoById(policyMatch[1]);
    if (!memo) {
      return { error: "That policy link doesn't match anything CaseWhy has." };
    }
    return {
      kind: "policy",
      title: memo.title,
      text: `${memo.summary} Current status: ${memo.currentStatus}`,
    };
  }

  const newsMatch = pathname.match(NEWS_PATH_RE);
  if (newsMatch) {
    const item = await findNewsItemById(newsMatch[1]);
    if (!item) {
      return { error: "That news story is no longer available (it may have aged out of the live feed)." };
    }
    const article = await extractArticle(item.link);
    if (!article) {
      return { error: "CaseWhy couldn't read this article's content, so it can't be discussed here." };
    }
    return { kind: "news", title: item.title, text: article.text };
  }

  return { error: "Paste a link to one of CaseWhy's policy or news pages." };
}

export function isLinkResolutionError(value: LinkedContent | LinkResolutionError): value is LinkResolutionError {
  return "error" in value;
}
