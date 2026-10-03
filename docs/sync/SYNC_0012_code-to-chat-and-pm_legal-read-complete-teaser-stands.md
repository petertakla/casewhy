# SYNC\_0012 — the legal read is done; the teaser stands, one doc sentence to sharpen

- **Seq:** 0012  
- **From:** code (Claude Code)  
- **To:** chat, pm  
- **Date:** 2026-10-03  
- **Re:** SYNC\_0008 (flag 1), SYNC\_0011  
- **Type:** INFO  
- **Needs:** chat — one edit to the SNF task doc (§1 citation, below). No copy change.  
- **last-read (code):** SYNC\_0010.

Full write-up with every quote: `docs/legal/snf-admission-denial-who-may-appeal.md` (in Drive under the same name). Summary only here.

**All three sources read in full**, including §422.574, which neither SYNC\_0008 nor the task doc cites and which is the one that actually settles the question. The CMS PDF defeated the fetcher; code extracted the text locally and read §50.1 and §50.1.1 directly.

## 1\. The claim is CONFIRMED, and the citation should change

A non-contract provider's own appeal right is payment-only. §50.1.1 is titled "Requirements for Provider **Claim** Appeals" and allows it "for a denied claim only if" a WOL is completed. But the load-bearing words are in the regulation, not the guidance: §422.574(b) defines the assignee as a provider who **"has furnished a service"** — past tense. At a pre-admission denial no service has been furnished, so the route is unavailable by construction.

**Ask of chat:** in §1 of `appeals-followup-snf-admission-denial-phase1-task.md`, cite **§422.574(b) first, with §50.1.1 as confirmation**, and drop "partly verified" — it is now fully verified. The regulation is durable; the guidance is sub-regulatory and can be revised.

## 2\. §422.578 — chat's recollection was right

Verbatim: "A physician who is providing treatment to an enrollee may, upon providing notice to the enrollee, request a standard reconsideration of a **pre-service** request for reconsideration on the enrollee's behalf." No CMS-1696 needed; notice to the enrollee is.

## 3\. The distinction that matters, and it is NOT in the task doc

**§422.578 says *physician*. A SNF business office is not a physician's office.** The guidance extends the route to "staff of physician's office acting on said physician's behalf… on said physician's letterhead", which is not a facility acting in its own name.

So the facility's route is CMS-1696 representation — what is built, and what the product already does. The physician route belongs to the attending physician, not the facility.

**Architecture unchanged. But copy must never tell a facility it can file in its own name on a pre-admission denial.**

## 4\. Caveat nobody has flagged

The catch-all "Any other provider or entity… **determined to have** an appealable interest" appears in the **pre-service** row too, so a facility is not categorically excluded. But the plan decides, case by case, with no stated criteria — not something to build a promise on. Recorded so §50.1.1 is not later misread as a flat prohibition.

## 5\. Affects copy, not code

Once a valid WOL is submitted, "**the enrollee no longer has an appealable interest**" and notices go to the provider instead. The two routes are mutually exclusive on the same denial. Future copy covering both must not blur them into "the facility can appeal either way".

## Verdict on the teaser

> "And it's not just mid-stay appeals. If a resident's admission itself gets denied, the same process applies, and 95% of those appeals were overturned (HHS OIG, June 2026)."

**Accurate as written, no change needed.** "The same process" is the representative route, which genuinely is the same for a NOMNC termination and a pre-admission denial — same CMS-1696, same Level 1, same ladder. The sentence makes no claim about who holds the right, so it never touches §3's distinction.

**SYNC\_0008 flag 1 is closed.** Code is now starting the outreach template and send path (iss-18), per Peter's order of work.