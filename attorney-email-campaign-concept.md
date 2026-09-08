# Attorney Email Campaign — Concept & Scope

**Status: in planning, sub-project running alongside the main build.** Purpose: recruit immigration attorneys as free "founding partner" entries in CaseWhy's Phase 1 attorney directory (`attorney-referral-directory-concept.md`, round 27 — already built, ships empty pending real vetted entries). This doc is the campaign side of that same effort: how to reach attorneys at scale, not just the one-by-one warm/local outreach already scoped separately.

## Decisions made so far

1. **Destination: a self-enroll landing page inside CaseWhy, not a reply-to-email ask.** Peter's own framing: the campaign should point attorneys to a real page on CaseWhy (`/attorneys/join`) where they can apply directly, rather than asking them to reply to an email. This does double duty — it converts interested attorneys into structured applications, *and* it introduces them to CaseWhy the product itself (they see the actual live case-tracking tool, not just a pitch). Applications still go through manual review before anything is publicly listed — this doesn't change the vetting principle already built into round 27, it just gives attorneys a self-service way to apply instead of Peter parsing email replies by hand.
2. **Sending domain: a separate marketing domain, not casewhy.com.** Peter's explicit decision (Sep 8) — register a new domain dedicated to this campaign, so a spam complaint or bounce-rate spike from cold outreach can't damage casewhy.com's sender reputation, which the app's real transactional email (magic links, status-change alerts) depends on. The landing page itself still lives on casewhy.com/app.casewhy.com — only the *sending* domain for the campaign emails is separate. **`casewhyhub.com` is registered** (Cloudflare Registrar, same as `casewhy.com`), with path-based routing (`/attorneys`, `/organizations`, `/employers`) rather than a `partners.` subdomain — see `partner-marketing-domain-concept.md` for the full reasoning. Next step: DNS on Cloudflare, then SPF/DKIM/DMARC records for the sending tool once one is picked.
3. **Recommended, not yet explicitly confirmed by Peter — proceeding unless told otherwise:**
   - **List sourcing: Apollo.io self-serve** (~$50-150/mo, has legal-industry filters) over AILA's formally licensed member list (real, but requires contacting AILA directly for pricing, slower to set up) or a fully manual/free list (doesn't scale to a real campaign).
   - **Scale: start with a smaller, Florida/Central-Florida-focused batch** (roughly 100-150 firms) rather than a national blast on day one — lower compliance risk while messaging is unproven, and it complements the local/AILA-Central-Florida-chapter outreach already in motion as its own track.

## Real constraint: the LLC and CAN-SPAM's physical-address requirement

Confirmed via CAN-SPAM Act research (FTC's own compliance guide, 16 CFR Part 316): every commercial email needs a real physical mailing address, and B2B cold outreach to attorneys is squarely "commercial" under the Act's definition — there's no B2B exemption. As of Sep 8, 2026, CaseWhy's Florida LLC filing was just submitted (delayed a day by a state holiday); Florida takes 10-12 business days to process new formations, putting real registration at roughly **Sep 22-24, 2026**. The EIN application happens only after that, per the formation service's own standard order. **This doesn't block building the landing page or setting up list sourcing/the sending domain now — it only blocks the actual send**, until there's a real address to put in the required footer (the LLC's registered address once formed, or an interim address Peter explicitly chooses, e.g. a PO box, if he wants to send sooner).

**Worth Peter's own confirmation, not resolved here:** round 13 (live Stripe billing) has separately been marked done and verified live for a while, even though several earlier sections of `CLOUD_CLAUDE.md` gated flipping Stripe to live keys on this same LLC/EIN chain being complete. Flagged directly in `CLOUD_CLAUDE.md` rather than assumed one way or the other.

## Compliance checklist for the actual send (once the address question is resolved)

- Real physical postal address (street address, PO box registered with USPS, or a registered private mailbox) in every email.
- Accurate "From" name/domain — no deceptive headers.
- Subject lines that reflect the actual content — no bait-and-switch framing.
- A clear, one-click (or near-one-click) unsubscribe mechanism; opt-outs honored within 10 business days; no fee, login, or extra info required to opt out beyond an email address.
- CaseWhy is liable for what any third-party sending tool does on its behalf — monitor bounce/complaint rates, don't "set and forget."

**Not a bar-rules problem, confirmed by research:** ABA Model Rule 7.3 and state-bar equivalents regulate a *lawyer's* solicitation of prospective *clients* — they don't reach a vendor company (CaseWhy) marketing a business partnership to attorneys. The one adjacent rule worth remembering for the product itself, not the emailing: Model Rule 7.2(b) limits what a lawyer can give in exchange for a referral — irrelevant here as long as Phase 1 stays free/non-exclusive with no fee-splitting, which is already the plan.

## Sending infrastructure notes

- Cold-outreach platforms (Instantly.ai, Smartlead, lemlist, Apollo's built-in sender) are built for multi-inbox rotation, automatic domain warm-up, and deliverability monitoring at volume — different from transactional services like Postmark (which assumes opted-in, expected mail). Don't route this campaign through the same Postmark account/domain used for the app's real transactional email.
- `casewhyhub.com` needs its own SPF, DKIM, and DMARC records (via Cloudflare DNS, same as `casewhy.com`) before any real sending — most cold-outreach tools walk through this during setup, and typically recommend a warm-up period (gradually ramping send volume) before a full batch goes out, to avoid tripping spam filters on a brand-new domain.
- Landing page links in the email point back to `app.casewhy.com/attorneys/join` — no reason those need to live on the new marketing domain; only the sending identity changes.

## Open items, need Peter's call

1. Confirm or override the Apollo.io / Florida-first-batch defaults above (proceeding with these unless told otherwise).
2. ~~Pick the new marketing domain name and register it.~~ Done — `casewhyhub.com` is registered. Remaining: DNS/SPF/DKIM/DMARC setup once a sending tool is picked.
3. Decide: wait ~2.5 weeks for the LLC's real address, or use an interim address to send sooner.
