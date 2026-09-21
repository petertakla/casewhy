// Round 63 Part 4 — resolves a pasted link to CaseWhy's own already-vetted
// content, server-side, never trusting client-supplied content for what a
// link "contains." A pasted link only ever resolves to one of a small,
// known set of internal content types (never an arbitrary external URL) —
// this is the actual security boundary for the whole feature: no fetch of
// user-supplied input, ever.
//
// Round 127 — added court rulings (src/lib/kb/court-rulings.ts) alongside
// policy memos, so the same "Does it apply to me?" / "How does it apply to
// me?" quick-ask links work from a court-ruling permalink page too, not
// just a policy-memo one.

import { findPolicyMemoById } from "@/lib/kb/policy-memos";
import { findCourtRulingById } from "@/lib/kb/court-rulings";
import { findNewsItemById } from "@/lib/news/permalink";
import { extractArticle } from "@/lib/news/extract-article";

export interface LinkedContent {
  kind: "policy" | "news" | "court";
  title: string;
  text: string;
}

export interface LinkResolutionError {
  error: string;
}

const POLICY_PATH_RE = /^\/policy\/([^/?#]+)\/?$/;
const COURT_RULING_PATH_RE = /^\/court-rulings\/([^/?#]+)\/?$/;
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
    return { error: "Paste a link to one of CaseWhy's policy, court-ruling, or news pages." };
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

  const courtMatch = pathname.match(COURT_RULING_PATH_RE);
  if (courtMatch) {
    const ruling = findCourtRulingById(courtMatch[1]);
    if (!ruling) {
      return { error: "That court ruling link doesn't match anything CaseWhy has." };
    }
    return {
      kind: "court",
      title: ruling.caseName,
      text: `${ruling.summary} Current status: ${ruling.currentStatus}`,
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

  return { error: "Paste a link to one of CaseWhy's policy, court-ruling, or news pages." };
}

export function isLinkResolutionError(value: LinkedContent | LinkResolutionError): value is LinkResolutionError {
  return "error" in value;
}
