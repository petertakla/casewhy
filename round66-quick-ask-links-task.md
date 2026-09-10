# New task for Claude Code — round 66: replace "Ask CaseWhy about this →" with two one-click questions that open /ask and get an answer immediately

**Status: authorized now, Sep 10.** Peter's own wording: "the 'Ask CaseWhy about this' line can be replaced by 2 questions on the same line at both ends: Does it apply to me? and How it applies to my case? this should open the AI question with this context along with the receipt number to get an AI response." **Follow-up from Peter, same day:** shorten the second question to "How it applies to me?" (matches "Does it apply to me?" for length/consistency), and make sure the two questions actually produce two different answers from the AI, not two near-identical rewordings of the same thing — his exact words: "both questions should have a different answer from each other ... I'll leave it up to you to fine-tune."

This is a genuine feature change, not a copy tweak — today, clicking "Ask CaseWhy about this →" just lands on the internal `/policy/[id]` or `/news/[id]` permalink page. Nothing there asks the AI anything. Actually getting an AI answer today takes several extra steps: copy that permalink, go to `/ask`, paste it into the "Paste a CaseWhy policy or news link…" box, then click one of the two fixed pills that appear. This round collapses that into one click.

## The two questions, exact wording

Everywhere this pattern appears, use exactly:

- **"Does it apply to me?"**
- **"How it applies to me?"**

These replace both the "Ask CaseWhy about this →" secondary link *and* the existing fixed-pill wording inside `/ask` itself. Round 63 shipped those pills as "Does this apply to my case?" / "What does this mean for my case?" (in `CaseChat.tsx`) — rename both to the two lines above.

**Make sure the two answers are actually different, not two rewordings of the same reply.** The two questions are close enough in wording (both are short, both start with "How/Does it apply") that a model can easily answer them near-identically unless the underlying prompt steers them apart. Peter's own instruction: the two answers need to be genuinely distinct, and he's leaving the exact approach up to you. A reasonable split: "Does it apply to me?" is a relevance check — does this specific policy or story actually bear on this case's type/status/dates, yes/no/uncertain, with the reasoning; "How it applies to me?" assumes relevance and explains the practical effect — what it actually means for the case's timeline or next steps. The button label shown to the user can stay exactly as short as specced above, but the underlying message text actually sent to the model doesn't have to be word-for-word identical to the button label if that's what it takes to get two genuinely different answers — e.g. sending a slightly fuller instruction like "Assuming it applies to me, how does it affect my case specifically?" behind the "How it applies to me?" button is fine. Check this live with a case whose citation genuinely has something substantive to say (not a case where the policy is obviously irrelevant either way), and adjust the sent wording if the two replies come back too similar.

## Where this replaces the old single link (3 places)

1. **`src/app/news/page.tsx`** — each story card's "Ask CaseWhy about this →" line.
2. **`src/app/ask/CaseChat.tsx`**'s `relatedPolicies` block ("Policy background that may apply to this case").
3. **`src/app/dashboard/page.tsx`**'s matching `relatedPolicies` block ("Policy background referenced above").

Layout: put both new links on the same line, at opposite ends — the citation text (or, on `/news`, the story's source/date line) on the left, the two question links together at the right end of that same row. On `/news`'s card, where the external link is already its own full-width block, put the new row underneath it with `justify-between` so "Does it apply to me?" and "How it applies to me?" sit at the two ends of that row. Keep both links small and muted relative to the primary external link, same visual weight rule round 65 already established for this secondary content.

## What happens on click — three different mechanics depending on where you start

**From inside `/ask` itself (`CaseChat.tsx`'s own relatedPolicies block):** no navigation needed — the case is already loaded right there. Clicking either link should directly attach that policy's link (`/policy/${p.id}`) and immediately send the matching question in the current conversation, exactly as if the user had pasted the link into the attach box and clicked the corresponding fixed pill, minus those two extra steps. Refactor so both this click path and the fixed-pill click path (and the new auto-fire path below) share one function — something like `attachAndAsk(url, question)` — rather than duplicating the attach-then-send logic three times.

**From `src/app/dashboard/page.tsx`'s relatedPolicies block:** there's no live chat here, so this has to navigate to `/ask`. Build the two links as `/ask?link=<policy path>&ask=applies` and `/ask?link=<policy path>&ask=explains`, and — since the dashboard already knows exactly which case is on screen — also include `&receipt=<that case's receipt number>` so `/ask` opens grounded in the *same* case being viewed, not whatever `/ask` would otherwise default to.

Watch for a real edge case here: the case shown on the dashboard might be an ad-hoc lookup the signed-in user hasn't tracked yet (`tracking.alreadyTracked` false). `/ask`'s existing logic (`src/app/ask/page.tsx`) only ever grounds in one of the user's own *tracked* cases — an untracked `?receipt=` gets silently ignored and falls back to the user's first tracked case instead. That would silently ask about the wrong case. Only render these two new quick-question links when the case on screen is actually tracked (`tracking?.alreadyTracked`); when it isn't, leave the citation as just its plain external link with no secondary link at all, same as the state before round 65, rather than risk routing someone to a different case's context than the one they were just reading about.

`ExplanationBox` will need `receiptNumber` passed down as a new prop from `StatusCard` (it currently only receives `explanation`) to build these links.

**From `src/app/news/page.tsx`:** also navigates, also no case in view — build the two links as `/ask?link=<news path>&ask=applies` and `/ask?link=<news path>&ask=explains`, with no `receipt=` param. Let `/ask/page.tsx`'s own existing default-case logic (first active tracked case, or its existing "sign in" / "track a case first" empty states for anyone without one) handle the rest — that's the same fallback the page already uses for a bare `/ask` visit today, so this round doesn't need to invent a new one. If the signed-in visitor has more than one tracked case, whichever one `/ask` already defaults to today is the one this opens against — not a new ambiguity this round needs to resolve differently.

## Wiring `/ask` to auto-fire

`src/app/ask/page.tsx` needs to read two new search params, `link` and `ask` (alongside the existing `receipt`), and pass them down to `<CaseChat>` as new props (e.g. `initialLinkedUrl` and `initialAutoAsk: "applies" | "explains"`).

`CaseChat.tsx` needs an effect that, once on initial mount (only when the chat is genuinely empty — `messages.length === 0` — and both new props are present), attaches the link and sends the matching question automatically, producing a real AI reply without any further click. `src/lib/ai/link-context.ts`'s `resolveLinkedContent()` already accepts a bare path like `/policy/abc123` directly (not just a full URL — see `extractPathname()`), so `initialLinkedUrl` can be passed straight through as `linkedUrl` with no need to build an absolute URL client-side.

The one real gotcha to watch for: `setLinkedUrl(...)` and calling `send()` in the same effect tick can race, since `send()` currently reads `linkedUrl` out of React state — if `send()` fires before that state update has actually landed, the very first auto-asked question would go out *without* the linked context attached, which defeats the entire point of this round. Don't let that regress silently. Either have `send()` accept an explicit optional `linkedUrl` override argument that takes priority over state, or otherwise guarantee the attach has actually landed before the question is sent — whichever is cleaner given the rest of the component's shape.

`<CaseChat key={receiptNumber} ...>` in `ask/page.tsx` already remounts the whole component on a case switch, which helps guarantee this effect only runs once per genuinely fresh load rather than misfiring on a later re-render.

## What's explicitly out of scope this round

- The anonymous `/get-help/ask` surface — there's no case or receipt number concept there at all, so this pattern doesn't apply to it.
- Preserving `?link=`/`?ask=` through a sign-in redirect. A signed-out visitor (or a signed-in visitor with no tracked case yet) who clicks either link from `/news` lands on `/ask`'s existing "Sign in and track a case to start asking questions about it" empty state, same as today — the link/ask context is simply lost in that case, and they'd need to click the link again from `/news` after signing in and tracking a case. That's an acceptable, disclosed limitation, not something this round needs to solve with a return-path through auth.
- Any change to the manual-attach "Paste a CaseWhy policy or news link…" flow inside `/ask` — that stays exactly as-is, as a second, independent way to reach the same two questions from within an existing chat about an unrelated link someone found elsewhere.

## Verify live

Confirm all three surfaces show the new two-link pattern with the exact wording above, positioned on one line. From `/news`, click "Does it apply to me?" on a real story and confirm it lands on `/ask` already answered — a real reply grounded in that story's actual content, not a blank chat waiting for input. From the dashboard's citation block on an actually-tracked case, confirm the same, and confirm it opens grounded in *that* case specifically (not a different tracked case). From `/ask`'s own citation block, confirm clicking either link answers immediately in the current conversation without a page reload, and confirm the existing manual paste-and-pill flow still works unchanged afterward. Confirm an ad-hoc, not-yet-tracked case's citations on the dashboard fall back to showing no secondary link (not a misrouted one). `tsc`/lint clean, production build succeeds.
