// Round 20, item 5 — inline-link recognized terms (RFE, NOID, the "high-risk
// countries" hold, public charge, etc.) in AI-generated explanation prose to
// the matching KB article, when a real match exists. No new content: this
// only wires up terms and articles that already exist and were already
// deterministically matched for this case (see findRelevantPolicyContext) —
// it never guesses at a KB match beyond what was already computed.
//
// Round 24 — added a second, always-on source of matches: TERM_LINKS
// (src/lib/kb/term-links.ts), fixed terms like "Visa Bulletin" and N-400/
// I-485 that link regardless of whether a case's own matched policies
// happen to include them. Both sources feed the same matching/rendering
// pass (not two separate passes run over each other's output) so overlaps
// between a policy-matched keyword and a fixed term are resolved once,
// the same way overlapping policy matches already were.

import type { ReactNode } from "react";
import { POLICY_MEMOS, type PolicyMemo } from "./policy-memos";
import { TERM_LINKS } from "./term-links";

interface Match {
  start: number;
  end: number;
  url: string;
  title: string;
  internal: boolean;
  text: string;
}

/** Renders `text` with the first mention of each matched policy's keywords, and any fixed TERM_LINKS terms, linked to their source. */
export function linkifyExplanation(
  text: string,
  policies: Pick<PolicyMemo, "id" | "title" | "sourceTitle" | "sourceUrl">[]
): ReactNode {
  const lower = text.toLowerCase();
  const matches: Match[] = [];

  for (const ref of policies) {
    const policy = POLICY_MEMOS.find((p) => p.id === ref.id);
    if (!policy) continue;
    for (const keyword of policy.statusKeywords) {
      const idx = lower.indexOf(keyword.toLowerCase());
      if (idx !== -1) {
        matches.push({
          start: idx,
          end: idx + keyword.length,
          url: policy.sourceUrl,
          title: policy.title,
          internal: false,
          text: text.slice(idx, idx + keyword.length),
        });
        break; // one link per policy, first mention only
      }
    }
  }

  for (const termLink of TERM_LINKS) {
    const idx = lower.indexOf(termLink.term.toLowerCase());
    if (idx !== -1) {
      matches.push({
        start: idx,
        end: idx + termLink.term.length,
        url: termLink.url,
        title: termLink.term,
        internal: Boolean(termLink.internal),
        text: text.slice(idx, idx + termLink.term.length),
      });
    }
  }

  if (matches.length === 0) return text;

  matches.sort((a, b) => a.start - b.start);
  // Drop any overlapping match (keeps the earlier one) — two sources could
  // otherwise both claim overlapping text.
  const clean: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    clean.push(m);
    cursor = m.end;
  }

  const nodes: ReactNode[] = [];
  let pos = 0;
  clean.forEach((m, i) => {
    if (m.start > pos) nodes.push(text.slice(pos, m.start));
    nodes.push(
      <a
        key={i}
        href={m.url}
        target={m.internal ? undefined : "_blank"}
        rel={m.internal ? undefined : "noopener noreferrer"}
        className="underline decoration-dotted underline-offset-2 hover:text-brand-600 dark:hover:text-brand-400"
        title={m.title}
      >
        {m.text}
      </a>
    );
    pos = m.end;
  });
  if (pos < text.length) nodes.push(text.slice(pos));

  return nodes;
}
