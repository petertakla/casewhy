# New task for Claude Code — round 65: restore direct external-source links, keep the internal permalinks as a clearly-labeled secondary option

**Status: authorized now, Sep 10.** A real, direct regression report from Peter after looking at what round 63 actually shipped, verbatim: "I just looked at the links and they don't point to external source. That is a misunderstanding ... want the external source back and let's work around that."

## What actually happened — checked directly against the live code

Round 63 changed three places so the primary, only link on each item became CaseWhy's internal permalink instead of the real external source:
- `/news` (`src/app/news/page.tsx`) — each story card used to link straight to `item.link` (the real article). It now links to `/news/[id]` instead, full stop.
- `CaseChat.tsx`'s "Policy background that may apply to this case" block — each citation used to link straight to `p.sourceUrl`. It now links to `/policy/[id]` instead.
- `dashboard/page.tsx`'s matching "Policy background referenced above" block — same change, same regression.

This was a real product miss, not a misunderstanding of what was asked — round 63's own task doc said to update these links to point internally, without flagging that doing so would remove the one-click path to the actual source, which is what people actually expect from a news/policy citation. Peter caught it by using the real, live surface.

**The fix is not to revert round 63 outright** — the internal `/policy/[id]` and `/news/[id]` pages still need to exist and be reachable, because they're what the "paste a link" AI Q&A feature (round 63 Part 4) points at, and there's no other way to get a pasteable CaseWhy link for an article or memo. The fix is to make both links available, with the external source restored as the obvious, primary one — exactly what Peter asked for: get the external source back, and work around the conflict rather than dropping the internal-link capability that round 63 was built for in the first place.

## The fix, three places

**1. `/news/page.tsx`.** Each item stops being one big `<Link>` to `/news/[id]`. Restructure each card so the title/source block is a real external `<a href={item.link} target="_blank" rel="noopener noreferrer">` again — the exact pre-round-63 behavior — and add a second, smaller, clearly-labeled link beneath or beside it: **"Ask CaseWhy about this →"**, pointing to `/news/${newsItemId(item)}`. Word it this way, not something generic like "View on CaseWhy" — the label should tell someone *why* there's a second link (it's the one to copy if they want to paste it into `/ask`'s AI Q&A), not just that one exists.

**2. `CaseChat.tsx`'s relatedPolicies block.** Restore the policy title as the external link (`href={p.sourceUrl}`, `target="_blank"`, exact pre-round-63 behavior), and add a small secondary link right after it, same "Ask CaseWhy about this" framing, pointing to `/policy/${p.id}` — compact enough to fit the existing citation-list styling (this is a dense list, not a card grid, so keep the addition small and muted, not equal visual weight to the primary link).

**3. `dashboard/page.tsx`'s matching block.** Identical fix, same two-link pattern — this is the same UI shape as #2, just rendered in a second place; keep both in sync rather than fixing one and forgetting the other, the same lesson every prior "grep for every occurrence" round has needed.

**Leave `/news/[id]/page.tsx` and `/policy/[id]/page.tsx` themselves untouched** — both already correctly link back out to the real source ("Read original ↗" / "Read the primary source ↗"), and both are still exactly what the paste-a-link AI feature needs to resolve. This round is only about which link is primary on the surfaces that list these items, not about removing the permalink pages.

## Verify live

Confirm `/news`'s cards click straight through to the real external article again, with the new secondary "Ask CaseWhy about this" link landing on the correct `/news/[id]` page. Confirm both relatedPolicies blocks (chat and dashboard) do the same — primary click goes to the real `sourceUrl`, secondary click goes to `/policy/[id]`. Confirm round 63 Part 4 (paste-a-link AI Q&A) still works end-to-end afterward — copy a link from one of the new secondary links, paste it into `/ask`, confirm both fixed questions still resolve correctly, since that's the one thing this round could plausibly break by touching the same components. `tsc`/lint clean, production build succeeds.
