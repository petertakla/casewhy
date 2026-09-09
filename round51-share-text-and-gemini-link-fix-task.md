# New task for Claude Code — round 51: two real bugs — share text wording, Gemini link has no context

**Status: authorized now, Sep 9.** Peter checked both round 44/49's share function and round 48's verification links live and found real problems with each. Two independent fixes, same round since both are small.

## Bug 1 — share text: round 49 changed more than the order, or never shipped correctly

Peter's report: the live share text is "not what I asked." Round 49's task (`round49-share-text-ordering-fix-task.md`) was scoped narrowly — reorder the three named entity types within the *existing* generic share pitch, nothing else — but whatever is live now isn't just that reorder. Before touching anything, **check with `git log`/`git show` what actually happened to this text on both branches** (the Next.js app's `<ShareButton>` call site(s) carrying this generic pitch, and the static-site vanilla-JS widget on `main`) — did round 49 rewrite the sentence into something else (e.g. pulling in round 45's full new hero subheadline instead of just reordering names), or did it never actually ship and this is still round 44's original, unreordered text? Either way, the fix is the same:

**Set the text to exactly this, wherever this generic three-entity pitch line appears** (the homepage hero placement, and any other placement using the same generic "learn more" pitch rather than a listing-specific one):

> Free legal aid, accredited representatives, attorneys, and more — all in one place. No fees. No ads.

This keeps Peter's own wording and structure (his direct instruction), just corrected to real punctuation. Do **not** substitute round 45's longer hero subheadline sentence here — that's a different piece of copy for a different placement (the hero text itself, not the share pitch) and should stay as round 45 shipped it.

**Scope, same as round 49:** only touches wherever this exact three-entity list appears as the share pitch. Does not touch the per-listing permalink share text (a single named resource, not a list) or the hero headline/subheadline copy itself.

## Bug 2 — Gemini link opens with no context (genuinely not fixable as a URL parameter — recommending a real fix)

Peter's report: the Gemini link opens but with no context — this matches round 48's own honest note that it shipped a plain `https://gemini.google.com/app` link with no query, because the deep-link/prefill format couldn't be safely confirmed at the time (an ad-injecting extension interfered with testing).

**Checked directly this round: it's not a testing artifact — Gemini's consumer web app has no supported URL parameter for prefilling a prompt at all**, confirmed via a live Sep 2026 discussion thread of people asking Google for exactly this (`q=`/`prompt=` support) with no official mechanism existing. The handful of workarounds that exist require the *visitor* to have a specific browser extension installed — not something CaseWhy can rely on for a random visitor, so this isn't a "guess the right parameter" problem, there just isn't one to guess.

**Recommended real fix — copy-to-clipboard + open, so the visitor actually gets the context:** clicking "Ask Gemini about [Name]" should (a) copy the constructed query text to the clipboard — reuse the same `navigator.clipboard.writeText()` pattern already in `ShareButton.tsx`'s copy-link button — (b) open `https://gemini.google.com/app` in a new tab as before, and (c) show a brief one-time tooltip/toast near the link, e.g. "Query copied — paste it into Gemini," so the visitor knows to paste rather than staring at a blank chat. This is the honest version of "give the visitor context" given the real constraint, not a workaround that silently fails.

If clipboard write fails (permissions, unsupported browser — same real-world case `ShareButton.tsx` already handles gracefully), fall back to just opening the plain link as today, no broken tooltip.

## Verify live

Bug 1: confirm the corrected text renders on the real homepage hero share action on `casewhy.com` (both the native share-sheet path if testable and the fallback dropdown), and on the Next.js app side if the same three-entity list appears there too. Confirm no other placement was touched. Bug 2: confirm on a real permalink page that clicking "Ask Gemini about [Name]" actually copies the constructed query (check the real clipboard content, not just that the function ran) and opens Gemini in a new tab, and that the fallback (plain open, no tooltip) works when clipboard access is denied. `tsc`/lint clean, production build succeeds on both branches. Report back and fold into `CLOUD_CLAUDE.md`'s standing status — including confirming round 49's actual prior state (shipped-but-wrong vs. never shipped) so the record is accurate.
