# New task for Claude Code — round 85: community-forum monitoring and draft-reply queue (Phase 1 marketing, finally started)

**Status: authorized now, Sep 13. Renumbered from an earlier "round 82" draft** — that number got used independently by Claude Code for unrelated work (the language switcher) before this task doc was ever seen, so it was never built under that number. Confirmed via the "CaseWhy — Round Status Tracker" doc that round 85 is genuinely unclaimed.

Phase 1 of the marketing plan (organic community distribution) has been fully scoped since the guardrails doc but never actually started — zero posts made anywhere. This round builds the tooling to start it: code monitors a small set of forums for genuinely relevant questions, drafts a grounded reply, and queues it for Peter's review — reusing the same pending-approval pattern already built in round 70, not a new mechanism.

## Prerequisite — peter@casewhy.com, specified in full this time

**Set up** **peter@casewhy.com** **as a Workspace alias on** **info@casewhy.com**, same mechanism as round 70's dozen business aliases — mail lands in the same real inbox, filtered by label, nothing new to log into. This is Peter's own manual step in the Workspace admin console (adding the alias itself), same as round 70's prerequisite.

**Sub-organize by platform using nested Gmail labels + filters, same filter-by-sender pattern round 70 already uses:**

  - A filter matching mail **to** peter@casewhy.com **from** each platform's known notification-sending domain (e.g. mail.redditmail.com for Reddit, facebookmail.com for Facebook, quora.com for Quora, and equivalents for VisaJourney/Trackitt/immigration.com if they send account mail from a consistent domain) applies a nested label — Peter/Reddit, Peter/Facebook, Peter/Quora, etc. — which Gmail renders as a sub-folder under Peter.
  - Confirm each platform's actual sending domain before building the filter (don't guess — check a real signup/notification email from each, same "verify before assuming" discipline as everywhere else in this project).
  - **This sorts inbound mail by which platform emailed Peter (verification links, reply notifications), not by which platform CaseWhy posted to** — that's a different thing, already covered by the approval queue's own history (see below), not an email-sorting problem.

**Peter creates the actual platform accounts himself** (Reddit, and any forum requiring one) using this new alias — not something Claude Code can do, since account creation is inherently a manual, human action per platform.

## Platform scope — checked for real feasibility before including anything

**In scope, monitored automatically:**

  - **Reddit** (r/USCIS, r/immigration, r/immigrationlaw, and relevant form-specific subreddits) — via Reddit's public JSON endpoints (e.g. reddit.com/r/USCIS/new.json), which require no login or API key for read access. Start here; it's the cleanest source.
  - **Forums with a real RSS feed** (check VisaJourney, Trackitt, immigration.com specifically for one before assuming — many older-style forums have one by design). Only include a forum in the automated monitor if it has a genuine feed; don't scrape a forum that doesn't offer one.

**Explicitly excluded from automated monitoring — flag as manual/occasional only, don't build this:**

  - **Facebook Groups** — no public API for group content, and Facebook's ToS prohibits scraping. An automated monitor here risks the account it runs through getting banned, and reflects badly on CaseWhy if it ever surfaced. Leave as manual browsing.
  - **Quora** — same reasoning, no public API to build against.

## What the monitor does

  - Poll the in-scope sources at a sensible interval, targeting roughly **8-10 candidate threads/day** total across all sources — tunable, not fixed, once real signal-to-noise is visible.
  - **A relevance filter, not just keyword matching.** A thread mentioning "USCIS" isn't automatically worth a reply — it needs to be a genuine question CaseWhy's own data can answer well: a processing-time question, a policy-change question, "what does this status mean," or "where do I find help" (Get Help directory territory). Use whatever classification approach fits the existing codebase's patterns (likely an LLM call, similar to how case explanations are classified/generated elsewhere in the app) rather than a hardcoded keyword list.
  - **Draft a reply grounded only in CaseWhy's real, existing data** — processing-times, the policy library (/policy), the Get Help directory. Same sourcing discipline as every AI-generated surface elsewhere in this app: never invent a statistic or policy claim. If the question can't be answered well from real CaseWhy data, don't force a draft — skip it rather than generating filler.
  - **Surface that specific community's self-promotion rule alongside the draft**, not just the reply text — reuse the guardrails doc's per-channel notes (e.g., "check the subreddit's own self-promo rule first, varies per community") so Peter sees the constraint next to the draft, not just the draft in isolation.

## Reuse round 70's approval-queue pattern — one real difference to build in

Extend the same in-app pending-approval queue UI from round 70 to hold a new item type: community-reply drafts. Same Approve / Edit-then-approve / Reject actions, same principle that nothing fires automatically. **This queue's own history is the actual record of what CaseWhy posted where** — the email-label sorting above is separate and only covers inbound platform notifications.

**The one hard difference from round 70: "approve" here does not post anything anywhere.** Round 70's approval triggers a real email send via a Workspace alias — that's safe to automate because it's CaseWhy's own domain and mailbox. Reddit/forum posting has no equivalent safe automated path (a scripted posting credential risks account suspension and undermines "Peter's own voice" regardless). **Approving a community-reply draft here should just mark it "ready" and surface the final text for Peter to copy and paste himself**, from his own logged-in browser session, at his own timing. Make this distinction explicit in the UI copy (e.g., "Approved — ready to post" rather than anything implying it already went out).

## Verify live

Confirm the peter@casewhy.com alias and its nested platform labels/filters work correctly against a real test email from each platform (not just a hypothetical rule). Confirm Reddit polling actually pulls real, current threads (not cached/stale results), confirm the relevance filter is meaningfully filtering (spot-check a sample of what it flags vs. skips), confirm drafts cite only real CaseWhy data with no fabricated claims, confirm the per-community self-promo note is genuinely accurate for each source it's shown against, confirm the approval queue extension works end-to-end and that "approve" clearly does not auto-post. tsc/lint clean, production build succeeds. Report back and fold into CLOUD_CLAUDE.md's standing status, referencing round 70's queue pattern and the marketing playbook/guardrails doc as source material.
