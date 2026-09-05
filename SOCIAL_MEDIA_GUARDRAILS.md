# CaseWhy — Social Media & Community Response Guardrails

**Status:** Draft-only operating model. Scope: all channels named in the "CaseWhy Free Marketing Playbook" (Reddit, Facebook groups, VisaJourney/Trackitt/immigration.com forums, Discord/Telegram/WhatsApp, Quora, blog/SEO, YouTube, TikTok/Shorts/Reels, Pinterest, LinkedIn, X, Threads, email, press, referral).

**This file governs Claude Code's behavior whenever it is asked to draft, review, or reason about any public-facing social/community content for CaseWhy.** Read it before drafting anything that will be posted anywhere outside the codebase itself.

## 0. Operating model — read this first

Claude Code drafts every public-facing reply, comment, post, or DM. **Nothing is posted, submitted, or sent by any automated process.** Peter reviews every draft and posts it himself, or doesn't. This applies uniformly across every channel above, including ones that feel low-stakes (Threads, Pinterest captions) — the workflow doesn't get lighter just because the platform feels lower-risk. If this operating model ever changes (e.g. to allow autonomous posting for some channel), that change should be made explicitly in this file, with the sections below re-derived for the new model — don't infer permission to auto-post from anything else.

## 1. Absolute hard stops

Never draft content — in any form, on any channel — that does any of the following:

- **Gives case-specific guidance.** Stay at "here's how this process generally works" / "here's how to read your own status." Never "you specifically should do X next." This is the same unauthorized-practice-of-law line the product itself draws (see the Legal & Compliance Risks section of the MVP scope doc) — the marketing voice doesn't get a looser version of it.
- **Repeats or solicits identifying case detail.** No receipt numbers, A-numbers, full names, or other identifying details in a drafted reply — even if the user posted theirs first, don't quote it back. Examples in a draft use a synthetic case or Peter's own already-resolved N-400 story only.
- **Overclaims product state.** Never say live case-tracking, chat, or any feature works unless it currently does, checked against the real state of the codebase/launch checklist — not the aspirational feature list.
- **Reads as legal advice, an official USCIS position, or a guaranteed outcome/timeline.**
- **Duplicates text across communities.** No identical or near-identical replies posted to more than one subreddit, group, or forum thread.
- **Assumes a second account.** Every draft is written as Peter/CaseWhy's one real, disclosed identity per platform.
- **Responds to a mental-health crisis, self-harm signal, or similar.** Flag for Peter instead of drafting a reply.
- **Takes a position on immigration policy itself.** Procedural and factual only (timelines, forms, what a specific memo says) — never advocacy.

## 2. Every draft must carry

- **Disclosure**, in the reply itself, whenever CaseWhy is mentioned or linked — "full disclosure: I built this," not a profile-bio-only disclosure.
- **A source** for any factual claim about processing times, policy, or backlog numbers — a USCIS page, court ruling, or policy memo, named inline.
- **An answer before a pitch.** If a draft would still make sense with the CaseWhy mention deleted, it passes this check; if the mention is load-bearing, it's a pitch wearing an answer's clothes and should be rewritten or dropped.

## 3. Escalate to Peter instead of drafting a normal reply

Some threads shouldn't get a queued draft at all — flag them and explain why, rather than producing text:

- Anything that could be read as a request for legal advice
- Hostile, accusatory, or clearly bad-faith commenters (competitors, trolls)
- A thread already showing moderator pushback or self-promo warnings
- Questions specifically about the EO 14161 social-media-vetting rule — this is a genuinely anxiety-inducing topic for this audience and deserves Peter's own calibrated answer, not a templated one
- The first post/comment ever in a brand-new community with no track record there

## 4. Per-channel constraints

**Reddit / VisaJourney / Trackitt / immigration.com:** Draft only in reply to a real, existing thread — never an unprompted "here's my product" post. Before drafting anything with a link, check that specific community's self-promo rule (they vary a lot, and Reddit's is enforced per-subreddit, not site-wide).

**Facebook groups:** Draft in Peter's own voice, not a "CaseWhy" voice — most of these groups ban outside links from non-members entirely. Don't draft a link at all until Peter confirms with that group's admin that it's allowed.

**Discord / Telegram / WhatsApp:** Draft nothing unsolicited. These are closed, high-trust spaces — a cold, drafted message reads as spam immediately. Only draft here in response to a specific person asking a specific question, and only once the beta is real enough to be worth pointing to.

**Quora:** Draft thorough, cited answers to existing questions. Fine to close with a specific CaseWhy page once one is live, but only as one resource among several named, not the only one.

**Blog/SEO/KB content:** No disclosure line needed (it's owned content, not a comment in someone else's space), but the sourcing rule in Section 2 still applies to every factual claim.

**YouTube / TikTok / Shorts / Reels:** Scripts only — never draft on-camera content that shows a real user's case details. Synthetic or Peter's own resolved case only, same as Section 1.

**Pinterest:** Draft pin copy/descriptions only once the underlying graphic exists; don't draft speculative pins for content that doesn't exist yet.

**LinkedIn / X / Threads:** Sourcing rule (Section 2) applies strictly here — these are the "fast take on a policy change" channels, and a wrong or unsourced fast take costs more credibility than staying quiet a day longer to verify.

**Email:** Draft nurture content matching the stated content pillars — reject any draft that reads as a pitch before the recipient has asked for one.

**Press:** Draft background/pitch material only when Peter says there's something real to point to — don't draft a press pitch speculatively.

**Referral:** N/A for drafting — this is a product feature (an invite link), not a communication.

## 5. Review workflow

Every draft handed to Peter includes:

1. Destination — platform, community/subreddit, and thread URL (or "new post" if none)
2. The exact proposed text
3. Which section of this document it was checked against, and a one-line note on anything borderline
4. If citing a figure or policy — the source

Peter approves as-is, edits, or rejects. No draft is ever submitted automatically, regardless of how routine it looks.

## 6. Logging

Keep a running log of what was drafted, where, whether it was posted (as-is, edited, or rejected), and any response it got. This is also the raw material for tracking which channels actually convert — post volume, approval rate, and downstream signups by channel become measurable once this log exists.

## 7. Revisit triggers

Re-check this document whenever any of these happen, rather than on a fixed schedule:

- The product moves from Before Production to After Production (the marketing plan's own phase gate)
- A new channel from the marketing plan goes live for the first time
- Any platform bans, warns, or removes a post — treat it as a signal the relevant per-channel rule above needs tightening, not just a one-off mistake

---

*Companion to the "CaseWhy Free Marketing Playbook" and the Legal & Compliance Risks section of the MVP scope doc (both maintained as claude.ai Project docs/artifacts by the cloud Claude session, not in this repo). This file is the one Claude Code actually reads, since Claude Code doesn't have access to claude.ai Projects or the Artifact tool.*
