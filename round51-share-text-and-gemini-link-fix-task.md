# New task for Claude Code — round 51: two real bugs — share text wording, and swap Gemini for ChatGPT on the "ask an AI" link

**Status: authorized now, Sep 9 — revised same day (Gemini → ChatGPT).** Peter checked both round 44/49's share function and round 48's verification links live and found real problems with each. Two independent fixes, same round since both are small.

## Bug 1 — share text: round 49 changed more than the order, or never shipped correctly

Peter's report: the live share text is "not what I asked." Round 49's task (`round49-share-text-ordering-fix-task.md`) was scoped narrowly — reorder the three named entity types within the *existing* generic share pitch, nothing else — but whatever is live now isn't just that reorder. Before touching anything, **check with `git log`/`git show` what actually happened to this text on both branches** (the Next.js app's `<ShareButton>` call site(s) carrying this generic pitch, and the static-site vanilla-JS widget on `main`) — did round 49 rewrite the sentence into something else (e.g. pulling in round 45's full new hero subheadline instead of just reordering names), or did it never actually ship and this is still round 44's original, unreordered text? Either way, the fix is the same:

**Set the text to exactly this, wherever this generic three-entity pitch line appears** (the homepage hero placement, and any other placement using the same generic "learn more" pitch rather than a listing-specific one):

> Free legal aid, accredited representatives, attorneys, and more — all in one place. No fees. No ads.

This keeps Peter's own wording and structure (his direct instruction), just corrected to real punctuation. Do **not** substitute round 45's longer hero subheadline sentence here — that's a different piece of copy for a different placement (the hero text itself, not the share pitch) and should stay as round 45 shipped it.

**Scope, same as round 49:** only touches wherever this exact three-entity list appears as the share pitch. Does not touch the per-listing permalink share text (a single named resource, not a list) or the hero headline/subheadline copy itself.

## Bug 2 — swap Gemini for ChatGPT: confirmed working prefill/auto-send URL, unlike Gemini

Peter's report: the Gemini link opens but with no context — this matches round 48's own honest note that it shipped a plain `https://gemini.google.com/app` link with no query, because the deep-link/prefill format couldn't be safely confirmed at the time.

**Confirmed this round: Gemini's consumer web app genuinely has no supported URL parameter for prefilling a prompt** — there's no format to find, so no workaround was worth building on top of it.

**Instead, swap the link from Gemini to ChatGPT — `chatgpt.com` has a real, confirmed, working equivalent.** `https://chatgpt.com/?q=<encoded query>` opens a new chat and **automatically submits the query as a message on page load, no click or paste needed** — confirmed via a third-party security research write-up describing this exact behavior (real enough to be documented as a prompt-injection consideration, i.e. genuinely functioning, not a rumor). This delivers on the original ask (one click → the AI is already answering about this specific name) in a way Gemini structurally cannot.

**In `VerificationLinks.tsx` (or wherever this link lives):**
- Change the label from "Ask Gemini about {name}" to **"Ask ChatGPT about {name}"**.
- Build the href the same way the Google link's query is already built (same `context ? "name" context : "name"` pattern) — `https://chatgpt.com/?q=${encodeURIComponent(query)}`.
- Keep the same labeling philosophy round 48 established: this is a general-info assistant, not a verification tool, and should never be framed as confirming or checking anything — only the Google link carries that framing.
- Drop the clipboard-copy/tooltip idea entirely — it's not needed once the URL parameter itself carries the context.
- **Verify live, don't assume:** confirm the `?q=` behavior actually works as described for a signed-out visitor (not just someone already logged into ChatGPT) — the source describing this didn't confirm the signed-out case. If a signed-out visitor hits a sign-up wall instead of an auto-answered chat, report that back plainly rather than shipping it anyway; the fallback in that case is the same plain-link-no-query approach round 48 used for Gemini, just pointed at ChatGPT instead.

## Verify live

Bug 1: confirm the corrected text renders on the real homepage hero share action on `casewhy.com` (both the native share-sheet path if testable and the fallback dropdown), and on the Next.js app side if the same three-entity list appears there too. Confirm no other placement was touched. Bug 2: confirm on a real permalink page that clicking "Ask ChatGPT about [Name]" opens ChatGPT with the query already submitted and answered — test as a signed-out visitor specifically, not just a logged-in one. `tsc`/lint clean, production build succeeds on both branches. Report back and fold into `CLOUD_CLAUDE.md`'s standing status — including confirming round 49's actual prior state (shipped-but-wrong vs. never shipped) so the record is accurate.
