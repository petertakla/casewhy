# Proposed Terms of Service additions — Get Help directory (Sep 9)

**Status: drafted for Peter's review only — not authorized for Claude Code.** Same gating as `privacy-terms-additions-sep7.md` and `terms-tightening-asylum-daca-sep8.md`: this is proposed language, not a task doc. Per Peter's Sep 9 instruction, this joins the queue of accumulated Terms/Privacy edits and does **not** trigger its own attorney review — one immigration-lawyer review happens at the end of development, covering everything added since Sep 6 in one pass, not a review per round. Nothing here goes to Claude Code until Peter approves the wording (and any final tightening the lawyer wants gets folded in afterward, in the same single pass).

## Why this is needed

`terms.html` (effective Sep 6) doesn't mention the Get Help directory anywhere — not the six entity types, not the DOJ EOIR-sourced data, not the self-enrollment/join flow. That's a real gap: the Service now operates a live, nationwide directory (2,586 accredited-representative records alone) with real names, addresses, and phone numbers, plus a public form letting any org self-enroll. Below is proposed language to close that gap, written to slot into the existing document with minimal disruption — additions to existing sections plus one new section, not a rewrite.

## 1. Addition to Section 2 ("What CaseWhy Is")

Add a new paragraph after the existing "Depending on your plan..." paragraph:

> CaseWhy also offers "Get Help" — a free, public directory that helps you find immigration attorneys, DOJ-accredited representatives, legal aid and nonprofit organizations, university international student offices, community organizations, and, for employers, sponsorship resources. Listings are drawn from public government sources (such as the U.S. Department of Justice's roster of recognized organizations and accredited representatives) and from self-enrollment submissions by the listed organizations or individuals themselves. Get Help is informational only — see Section 8 and Section 10 for important limits on what a listing means.

## 2. Addition to Section 8 ("Third-Party Data and Services")

**Updated Sep 9** to state the actual refresh cadence Peter confirmed (round 42: quarterly for DOJ-sourced listings, annually for board-certification-sourced listings), so this disclaimer describes a real, concrete process rather than a vague "periodically." Add a new paragraph after the existing one (which currently covers only USCIS APIs, Census Geocoding, the congressional-rep table, and infrastructure vendors):

> Get Help listings come from two sources: public government and state-bar records (the DOJ's roster of recognized organizations and accredited representatives, and state-bar board-certification listings for attorneys) and direct submissions from the listed attorney, representative, or organization through our self-enrollment form. **Sourced listings are refreshed on a recurring schedule** — DOJ-sourced listings (accredited representatives and legal aid/nonprofit organizations) approximately quarterly, and state-bar board-certification-sourced attorney listings approximately annually — each refresh shown as a "last verified" date on the listing itself. **Self-enrolled listings are not part of this automatic refresh**; their accuracy is the listed party's own representation (see Section 7) and is only as current as when it was submitted or last confirmed. **We do not independently verify the licensing, accreditation, good standing, or current accuracy of any listing** beyond what the source record itself stated as of its last refresh, or beyond what the submitting party represented. Credentials lapse, contact information changes, and organizations close between refreshes; if you're relying on a listing to reach someone, confirm their current status and standing directly — for attorneys, your state bar's website; for DOJ-accredited representatives and recognized organizations, the DOJ's own published roster — before relying on it.

## 3. Addition to Section 10 ("Disclaimers")

**Updated Sep 9 per Peter's direct instruction** to lead with the exact disclaimer sentence he's also requiring on the `/attorneys` page itself (see `round39-referral-service-disclaimer-task.md`), so the page and the Terms use matching language rather than two differently-worded disclaimers describing the same thing.

Add a new subsection ("Get Help Listings") after the existing disclaimers paragraph:

> **This directory is for informational purposes only. It does not constitute a lawyer referral service, and listing does not imply an endorsement or recommendation by this platform.** This applies to every Get Help category, not attorneys alone — inclusion in any Get Help directory reflects only that a listing appeared in the public source we pulled from (as of its most recent scheduled refresh — see Section 8), or that the listed party submitted it themselves; it is not CaseWhy's assessment of quality, competence, or fit for your situation. We do not match you to a listing, do not receive any payment or fee from any listed attorney, representative, or organization for inclusion or placement, and are not a party to any relationship you form with a listed party. **Using the Service to find a listing, and contacting or engaging a listed attorney, representative, or organization, does not create any attorney-client, fiduciary, or other professional relationship between you and CaseWhy** — that relationship, if any, is between you and the party you contact. See Section 3 for how this relates to CaseWhy's own case-tracking guidance.

## 4. Addition to Section 3 ("Not Legal Advice"), one sentence

Add to the end of the existing first paragraph, so the "not a law firm" framing explicitly extends to Get Help:

> This applies equally to Get Help: pointing you toward a listed attorney, representative, or organization is not a legal recommendation, and CaseWhy is not responsible for the advice, services, or conduct of anyone you find through the directory.

## 5. Self-enrollment submissions — new short section, or fold into Section 7 ("Your Content")

Recommend folding into Section 7 rather than a new numbered section, since it's the same "you're responsible for what you submit" idea already established there for case content. Add a paragraph:

> If you submit a listing through a Get Help join form (as an attorney, accredited representative, organization, university office, or employer), you represent that the information you submit is accurate and that you're authorized to submit it on behalf of the organization named. Unlike sourced listings (see Section 8), a self-enrolled listing is not automatically re-verified on a schedule — its accuracy remains your responsibility to keep current. We may edit, decline, or remove any submitted or sourced listing at our discretion, including in response to a report that it's inaccurate or out of date, without notice.

## What this does *not* resolve — flagging separately, not a wording fix

`attorney-referral-directory-concept.md` raised a structural question that these additions don't touch: **Florida Bar Rule 4-7.22 defines "qualifying providers" subject to lawyer-referral-service regulation to explicitly include "directories."** If that or an equivalent rule in another state applies to a free attorney directory, no amount of Terms-of-Service disclaimer language fixes it — it would mean the *feature itself* needs a compliance review (registration, disclosure requirements, possibly restrictions on how attorneys are selected or ranked), not just better wording protecting CaseWhy from liability. Worth putting in front of the immigration lawyer at the single end-of-development review, and possibly worth a second opinion from someone who specifically does bar-regulatory/advertising work, since it's a different specialty than immigration law. Not urgent to resolve before the directory keeps growing, but shouldn't get lost given it's been sitting unresolved since the original concept doc.

## Suggested handling

Same as the two prior addition rounds: hold this as approved-but-unsent until Peter reviews the wording here, then it goes to Claude Code as a normal task doc (build into `terms.html`, same static site, same "no draft banner" treatment as the base document) alongside whatever else is queued for that pass — not before.
