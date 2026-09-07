# Privacy Policy & Terms of Service — additions approved Sep 7

**Status: approved by Peter, ready for Claude Code to implement.** Source: a review of a competitor's (Case Tracker for USCIS & NVC / ImmiVision, LLC) Terms of Use and Privacy Policy, comparing structure/coverage against CaseWhy's own live `terms.html` and `privacy.html`. Seven additions were recommended; Peter approved all seven, including the state-privacy-rights section, specifically so the document is as complete as possible before it goes to an attorney for review (his reasoning: a fuller draft means less for the attorney to add from scratch, which should mean a lower bill). **This does not replace that attorney review — `privacy.html` should keep its existing draft-pending-review banner, and none of this should be treated as legal advice.**

Do not rewrite sections that aren't listed below — pull the current live text from `casewhy.com/privacy.html` and `casewhy.com/terms.html` (or their source in this repo) as the base and insert/amend only what's specified here, preserving the existing wording, tone, and numbering style everywhere else.

## Privacy Policy (`privacy.html`) — 5 changes

**1. Amend the existing "What We Don't Do" section** — append one sentence to the end of its existing content:

> CaseWhy runs no advertising of any kind, so we don't use advertising trackers, third-party ad SDKs, or advertising identifiers (like a Google Advertising ID) — there's no ad network for your information to reach in the first place.

**2. Amend the existing "Your Rights" section** — append a new subsection at the end of it:

> **State-specific privacy rights.** Depending on where you live, you may have additional rights under state law, including:
>
> - **California** (CCPA/CPRA): the right to know what personal information we've collected about you, to request its deletion, to correct inaccurate information, to opt out of the sale or sharing of personal information (CaseWhy does not sell or share your personal information, so there is nothing to opt out of), and to not be discriminated against for exercising these rights.
> - **Colorado** (Colorado Privacy Act), **Connecticut** (Connecticut Data Privacy Act), **Virginia** (Virginia Consumer Data Protection Act), and **Utah** (Utah Consumer Privacy Act): similar rights to access, correct, delete, and obtain a portable copy of your personal information, and to appeal a denied request.
> - **Nevada**: the right to opt out of the sale of certain personal information (again, CaseWhy doesn't sell personal information).
>
> To exercise any of these rights, contact us at privacy@casewhy.com. We'll respond within the time required by applicable law. You also have the right to lodge a complaint with your state attorney general or other applicable data protection authority.

**3. New section — "Children's Privacy"** — insert as a new section immediately after "Your Rights" (with its new subsection above) and before "Not Legal Advice"; renumber every section from that point on:

> **Children's Privacy**
>
> CaseWhy is not directed to children, and our Terms of Service require users to be at least 18 years old. We do not knowingly collect personal information from anyone under 18. If you're a parent or guardian and believe your child has provided us with personal information, contact us at privacy@casewhy.com and we'll delete it.

**4. New section — "Business Transfers"** — insert immediately after the new "Children's Privacy" section, still before "Not Legal Advice":

> **Business Transfers**
>
> If CaseWhy is ever acquired by, merged into, or transfers substantially all of its assets to another company, your information may be transferred as part of that transaction. Any new owner would be bound to handle it under this Privacy Policy, or one that is materially similar — and if the new owner's policy is materially different, we'll notify you before your information is transferred, and you'll be able to request deletion of your data instead.

**5. Contact/mailing address — do not add yet.** Once the Florida LLC is confirmed (round 13, expected imminently), come back and add a formal company mailing address to the Contact section, matching how the ToS document already plans to name the LLC once it's filed. Not part of this round — flagging so it isn't forgotten once the LLC lands.

**Resulting section order for `privacy.html`** (renumber sequentially): Information We Collect, How We Use Your Information, What We Don't Do (amended), Third-Party Services We Use, Data Retention & Security, Your Rights (amended), Children's Privacy (new), Business Transfers (new), Not Legal Advice, Changes to This Policy, Contact.

## Terms of Service (`terms.html`) — 2 changes, both folded into existing sections, no renumbering needed

**6. Amend the existing "Acceptable Use" section** — append one sentence to the end of its existing content:

> You also represent that the information you provide to CaseWhy — including case details, receipt numbers, and any information about family members you track — is accurate, and that you won't use bots, scripts, or other automated means to access the Service except through any official API we may offer in the future.

**7. Amend the existing "Miscellaneous" section** — append one sentence to the end of its existing content:

> If CaseWhy is acquired, merges with another company, or transfers substantially all of its assets, your account and data may transfer as part of that transaction, as described in our Privacy Policy.

## Implementation notes

- Both pages are on the static marketing site (`main` branch, `casewhy.com` root), same as the original `terms.html`/`privacy.html` build (round 7/round-10-adjacent work) — not the Next.js app repo.
- Match each page's existing visual style exactly (same header/nav, footer, typography) — this is a content addition, not a redesign.
- `privacy.html` keeps its "draft, pending attorney review" banner — these additions don't change that status, they just make the draft more complete going into that review.
- `terms.html` stays published as final/effective per Peter's existing decision (round 6) — the two small additions here don't need a banner change, just an updated "Last updated" date.
- After deploying, report back the live URLs so the cloud session can verify both pages read correctly end to end.
