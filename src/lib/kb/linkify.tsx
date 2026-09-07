// Round 20, item 5 — inline-link recognized terms (RFE, NOID, the "high-risk
// countries" hold, public charge, etc.) in AI-generated explanation prose to
// the matching KB article, when a real match exists. No new content: this
// only wires up terms and articles that already exist and were already
// deterministically matched for this case (see findRelevantPolicyContext) —
// it never guesses at a KB match beyond what was already computed.

import type { ReactNode } from "react";
import { POLICY_MEMOS, type PolicyMemo } from "./policy-memos";

interface Match {
  start: number;
  end: number;
  policy: Pick<PolicyMemo, "title" | "sourceUrl">;
  text: string;
}

/** Renders `text` with the first mention of each matched policy's keywords linked to its source. */
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
        matches.push({ start: idx, end: idx + keyword.length, policy, text: text.slice(idx, idx + keyword.length) });
        break; // one link per policy, first mention only
      }
    }
  }

  if (matches.length === 0) return text;

  matches.sort((a, b) => a.start - b.start);
  // Drop any overlapping match (keeps the earlier one) — two policies could
  // otherwise both claim overlapping text if their keywords overlap.
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
        href={m.policy.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-brand-600 dark:hover:text-brand-400"
        title={m.policy.title}
      >
        {m.text}
      </a>
    );
    pos = m.end;
  });
  if (pos < text.length) nodes.push(text.slice(pos));

  return nodes;
}
