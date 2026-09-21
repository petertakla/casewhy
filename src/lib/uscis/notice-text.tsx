// Round 130 — USCIS's own raw case-status text (CaseStatus.statusDescription,
// and each history entry's completed_text_en) sometimes embeds a literal
// HTML anchor tag for certain notice types. Confirmed live: the I-751
// sandbox mock for WAC9999999999 includes
// `<a href="https://www.uscis.gov/addresschange" target="_blank">www.uscis.gov/addresschange</a>`
// as part of the raw text itself — this is USCIS's own data (see client.ts:
// statusDescription/history are a direct pass-through of
// raw.current_case_status_desc_en/raw.hist_case_status, never CaseWhy-
// templated), not a bug in how CaseWhy generates the text, only in how it
// was being displayed: a plain text interpolation (React JSX, react-pdf
// <Text>, a plain-text email body, a push-notification body) shows the tag
// characters literally instead of a real link or clean text.
//
// Deliberately NOT a general HTML parser and never dangerouslySetInnerHTML
// on this text — only recognizes this one specific, narrow anchor-tag shape
// via a whitelist regex and extracts href+display text explicitly. Anything
// that doesn't match this exact shape is left as plain text untouched, so
// this can never inject arbitrary markup.

import type { ReactNode } from "react";

export interface NoticeTextSegment {
  type: "text" | "link";
  value: string;
  href?: string;
}

const ANCHOR_RE = /<a\s+href="([^"]*)"(?:\s+target="[^"]*")?\s*>([^<]*)<\/a>/gi;

/** Splits raw USCIS notice text into plain-text and link segments wherever it embeds a literal `<a href="...">...</a>` tag. */
export function parseNoticeText(text: string): NoticeTextSegment[] {
  const segments: NoticeTextSegment[] = [];
  let lastIndex = 0;
  ANCHOR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANCHOR_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "link", value: match[2], href: match[1] });
    lastIndex = ANCHOR_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

/** Plain-text fallback for surfaces that can't render a real link (email, push notifications) — keeps the anchor's own visible text (already a readable URL in every case seen so far), just without the tag wrapper. */
export function stripNoticeHtml(text: string): string {
  return parseNoticeText(text)
    .map((s) => s.value)
    .join("");
}

/** Renders raw USCIS notice text for the web app — real, safe clickable links wherever it embeds one (external, since every case seen is a uscis.gov URL from USCIS's own text, not an internal CaseWhy page), plain text otherwise. */
export function renderNoticeText(text: string): ReactNode {
  const segments = parseNoticeText(text);
  if (segments.length === 1 && segments[0].type === "text") return text;
  return segments.map((s, i) =>
    s.type === "link" ? (
      <a
        key={i}
        href={s.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-brand-600 dark:hover:text-brand-400"
      >
        {s.value}
      </a>
    ) : (
      <span key={i}>{s.value}</span>
    )
  );
}
