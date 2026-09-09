# New task for Claude Code — round 45: revise the homepage hero to lead with the real differentiator, not bare tracking

**Status: authorized now. Content-only change, no functional/DB/schema impact — no legal review gate applies (unlike ToS text).**

## Why

Peter's own framing: the current hero leads entirely with case tracking — and case tracking, on its own, isn't new (Lawfully and VisaWatch both already do multi-case tracking and plain-language status translation for free — this was already the finding that corrected `immigration-case-companion-mvp-scope.md` Section 1's original "wedge" framing). The thing none of the three tracked competitors have at all is Get Help (round 38 called this a "genuine differentiator" for exactly this reason) — but today it's buried in section 3 of the homepage, well below the fold, while the hero — the first thing anyone reading `casewhy.com` sees — says nothing about it.

This round pulls the real differentiator into the first screen without dropping the tracking language entirely — tracking is still real, still the mechanism, and still matters for anyone searching "check my USCIS case status." The fix is emphasis, not a rewrite of what CaseWhy does.

## Exact copy to ship

Live today (`casewhy.com` hero, confirmed via a fresh fetch Sep 9):

> **Headline:** "Know what's happening. Know what's next."
> **Subheadline:** "CaseWhy checks your case with USCIS every day, explains what changed in plain English — grounded in real USCIS policy, not just a reworded status label — and lets you ask follow-up questions any time, day or night."
> **CTA:** "Notify me at launch"

**Replace with:**

> **Headline:** "Know what's happening. Know what to do next."
> **Subheadline:** "CaseWhy checks your case with USCIS every day and explains what changed in plain English — grounded in real USCIS policy, not a reworded status label. When that's not enough, we connect you to real help: free legal aid, accredited representatives, and attorneys — all free, no ads, ever."
> **CTA:** unchanged ("Notify me at launch") — this round is hero copy only, not the CTA or the pre-launch email-capture mechanism.

Note the subheadline drops the "ask follow-up questions any time" clause (that's the in-app chat feature, CW-32, gated to signed-in users — a fine thing to mention elsewhere on the page, but it was crowding out room for the Get Help mention in the one paragraph that gets read by everyone) and replaces it with the Get Help pitch, closing on the existing "free, no ads, ever" trust line already required everywhere else Get Help appears (`partner-marketing-domain-concept.md`). **The three named entity types are deliberately ordered free legal aid → accredited representatives → attorneys, not the reverse (Peter's own edit, Sep 9)** — leading with "free legal aid" puts the free/no-cost framing at the very front of the list itself, reinforcing the "free, no ads, ever" line that closes the sentence, rather than opening on the option that reads as the most premium/paid-adjacent to an audience likely anxious about cost.

## Scope — exactly this, nothing else

- Only the hero headline + subheadline text on `casewhy.com`'s `index.html` (static `main` branch). Do not touch the CTA button, the stats section below it, or any of sections 2-7 (feature breakdown, Get Help grid, trust section, founder story, final CTA, footer) — those are unchanged by this round.
- If the current live copy has drifted from what's quoted above by the time this is picked up (re-fetch and confirm before editing, don't assume this doc's snapshot is still current), apply the same edit pattern to whatever the live text actually is rather than blindly overwriting — the intent (pull Get Help into the hero, keep the tracking-mechanic sentence, order the three named types free-aid-first, close on the free/no-ads line) is what matters, not a literal find-and-replace if the source text has moved.
- No A/B test infrastructure needed for this round — ship the new copy as the only version. (Peter flagged that hero-copy performance is genuinely testable once there's real traffic; that's a separate future idea, not part of this round.)

## Verify live

Confirm the new headline/subheadline render correctly at both desktop and mobile widths (check for line-wrap/overflow issues — the subheadline is a similar length to the original, but re-check), no other section shifted, committed/pushed/deployed, and reconfirmed on the real `www.casewhy.com` production URL via a fresh fetch (not just the local dev server). Report back and fold into `CLOUD_CLAUDE.md`'s standing status.
