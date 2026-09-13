# New task for Claude Code — round 77: hero copy addition (recommendation #1 of 3, smallest first)

Status: authorized now, Sep 12. Content-only change, no functional/DB/schema impact — no legal review gate applies, same posture as round 45.

Revised twice same day:

1. First revision — keep the AI-explanation claim as the lead, add to it rather than deprioritizing it. Peter's explicit call: the hero should still lead with AI explaining the case, since that's still real and worth featuring. The addition is the checkability angle (named citations, not a black-box claim) and the escalation toolkit as a second beat.
2. Second revision — also surface the "Does it apply to me? / How it applies to me?" quick-question feature (round 66) as part of that same first beat, not as a separate fourth bullet. Peter's framing: this is a strong differentiator nothing else in the competitive set clearly has — the ability to ask, specifically, whether a given policy change or news item actually affects your case, and get a distinct answer for "does it apply" vs. "how does it apply," grounded in the case's real form type/dates/status.

## Why

A fresh competitive check (Sep 12) found Inmigreat now ships a real, live, case-grounded, multilingual AI assistant ("Lexi") — so "AI explains your case" alone is closer to parity than it was in September. AI stays the hero's lead idea; what makes CaseWhy's version worth naming specifically is: (a) named, checkable citations to actual policy memos/rulings rather than an opaque accuracy claim, and (b) the one-click "does this apply to me / how does it apply" mechanism (already built, round 66) that turns a general policy update or news story into a direct, case-specific answer — not a generic explanation the user has to interpret for themselves. Both of these are proof-points for the same underlying idea (CaseWhy's AI answers are grounded and personally relevant, not generic), so they read naturally as one clause, not two separate feature call-outs.

## Exact copy to ship

Current, live as of round 45 (verify with a fresh fetch before writing anything — don't trust this doc's memory of exact wording over a real live check):

Headline: "Know what's happening. Know what to do next." Subheadline: "CaseWhy checks your case with USCIS every day and explains what changed in plain English — grounded in real USCIS policy, not a reworded status label. When that's not enough, we connect you to real help: free legal aid, accredited representatives, and attorneys — all free, no ads, ever." CTA: "Notify me at launch"

Add to it (direction, not final locked wording — Claude Code's own judgment on exact phrasing within this direction, same latitude round 45 had):

Headline: unchanged — "Know what's happening. Know what to do next." isn't the problem. Subheadline direction: keep the existing AI-explanation sentence as the lead, but sharpen it in two connected ways: (1) make the citation claim concrete and checkable — naming that it cites the actual policy memo or ruling behind a change, not just an AI-generated summary — and (2) fold in that CaseWhy tells you plainly whether a given update actually applies to your specific case, and what it means for it, rather than leaving you to interpret a general explanation yourself. These two ideas belong in the same sentence or two, not as a separate bullet — they're both evidence of the same point (grounded and personal, not generic). Then keep or lightly tighten the existing escalation-toolkit and Get Help material that was already being added. If the whole paragraph is getting overloaded trying to fit AI+citations+personal-relevance+escalation+Get Help, it's fine to split into two short sentences, but don't let it become a bullet list — a hero subheadline reads as prose, not a feature dump.

What to deliberately avoid: don't claim CaseWhy's explanations are "more accurate" than competitors' — that's not a verifiable claim CaseWhy can back up either. The honest differentiators are checkability (a named source vs. an opaque percentage) and personal relevance (a direct does-it-apply-to-me answer vs. a generic explanation), not a superiority claim about correctness.

## Also check, don't assume (same discipline as every prior copy round)

* app.casewhy.com's own landing page (src/app/page.tsx) — per round 74, this now redirects signed-out visitors to casewhy.com rather than carrying its own copy, so there should be nothing to duplicate here anymore. Confirm that's actually true post-round-74 before assuming there's a second surface to update — if round 74 hasn't shipped yet, treat this the old way (check for a duplicate landing page and update it too).
* The /plus marketing page's own feature breakdown — check whether it's missing the escalation-toolkit or the does-it-apply-to-me mention, and align it with the same additions if so, without rewriting that whole page (that's round 78/79's territory, not this one).

## Verify live

Confirm the updated subheadline is live via a real fetch of casewhy.com (not just the commit diff), confirm AI explanation is still the lead clause (not demoted), confirm it reads as natural prose and not a crammed feature list, confirm it doesn't overclaim accuracy/superiority, confirm the CTA and email-capture mechanism are untouched, confirm whether app.casewhy.com's root needed the same check per the note above. tsc/lint clean if any code surface is touched (unlikely for a static content change, but confirm). Report back and fold into CLOUD_CLAUDE.md's standing status, noting round 45's section as the one being refined here.
