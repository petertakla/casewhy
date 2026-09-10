# New task for Claude Code — round 67: update entity language now that CaseWhy LLC is confirmed

**Status: authorized now, Sep 10.** CaseWhy LLC's formation was confirmed by the state on Sep 10, 2026 (Northwest Registered Agent, order #88978WW). The site's legal pages still describe CaseWhy as a sole proprietorship, which was accurate when written but is now factually wrong. This round fixes that. Attorney referral revenue has also been dropped entirely as a planned revenue line (unrelated to the LLC, noted here only because it touches nearby product docs — no code change needed for that, it's a planning-doc note, not a build item).

## 1. terms.html — Section 1, "Agreement to These Terms"

Current live text:

These Terms of Service ("Terms") govern your access to and use of CaseWhy, a web application currently operated as a sole proprietorship based in Florida ("CaseWhy," "we," "us," or "our"; a Florida LLC formation is in progress and these Terms will be updated to name it once filed).

Replace with:

These Terms of Service ("Terms") govern your access to and use of CaseWhy, a web application operated by CaseWhy LLC, a Florida limited liability company ("CaseWhy," "we," "us," or "our").

Keep everything else in Section 1 unchanged. Update the "Last updated" date at the top of the page to today's date, per the existing convention in Section 15 ("Changes to These Terms") — this counts as a real, substantive change (entity identity), not a typo fix, so it should get a new date and, per Section 15's own stated policy, existing users should be notified by email of a material change. Flag that email step back rather than sending it yourselves — Peter decides if/when that notice goes out, this round is the page content only.

## 2. privacy.html — Contact section

privacy-terms-additions-sep7.md (item 5) deliberately deferred adding a formal company mailing address to the Contact section until the LLC was confirmed. It's confirmed now, but **the LLC's registered address hasn't been pulled from the Northwest Registered Agent formation documents yet** — that's Peter's own step, not something to guess at or leave blank with a placeholder. Do the following instead:

- If privacy.html has any wording describing CaseWhy's business structure (parallel to the ToS "sole proprietorship" line — check for it, don't assume it isn't there), update it the same way: CaseWhy LLC, a Florida limited liability company.
- Leave the Contact section's address field for a follow-up round once Peter provides the registered address — don't add a placeholder or a partial address.

## 3. Footer / About page — flag only, no build

Peter hasn't decided whether to display "CaseWhy LLC" in the site footer or an About page as a trust signal — this is optional and not required for legal accuracy (the ToS/Privacy fix above covers the legal requirement). Don't add it anywhere unprompted; wait for a separate go-ahead.

## Not in scope for this round

- The CAN-SPAM footer address for the attorney email campaign (attorney-email-campaign-concept.md) — same "needs the real registered address first" blocker as item 2 above, tracked separately in that document.
- Stripe account / business bank account naming — these are Peter's own administrative steps (opening/renaming accounts under CaseWhy LLC), not a CaseWhy codebase change.
- Any ToS section beyond Section 1's entity line — nothing else in the Terms depended on entity type.

## Verify live

Confirm terms.html Section 1 reads correctly with the new entity name and updated date, confirm no other page references "sole proprietorship," confirm privacy.html's equivalent language (if any) matches, confirm the Contact section's address field is untouched (not blanked, not guessed). tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, noting explicitly that the registered address is still needed from Peter for both privacy.html's Contact section and the CAN-SPAM campaign footer.
