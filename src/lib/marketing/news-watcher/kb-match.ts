// Round 90 — simple keyword match between a watcher item's title/summary
// and CaseWhy's own policy KB (src/lib/kb/policy-memos.ts), so a later
// round's drafts can link the CaseWhy permalink once LINKS_ENABLED flips
// on. Deliberately loose (substring match against each memo's own
// statusKeywords, plus its title words) — this only populates a reference
// field (newsItems.kbRelatedMemoIds) that nothing reads yet, not something
// a draft's accuracy depends on, so a few false positives cost nothing and
// a missed match just means the field stays empty for that item.

import { POLICY_MEMOS } from "../../kb/policy-memos";

export function matchKbMemoIds(title: string, summary: string): string[] {
  const haystack = `${title} ${summary}`.toLowerCase();
  const matched: string[] = [];

  for (const memo of POLICY_MEMOS) {
    const keywordHit = memo.statusKeywords.some((kw) => kw.length > 3 && haystack.includes(kw.toLowerCase()));
    const titleWords = memo.title
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4);
    const titleHit = titleWords.some((w) => haystack.includes(w));
    if (keywordHit || titleHit) matched.push(memo.id);
  }

  return matched;
}
