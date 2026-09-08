# Partner Marketing Domain & In-App Help Directory — Multi-Audience Structure

**Status, updated Sep 8 (checked against `CLOUD_CLAUDE.md`'s own build log): Attorneys (round 27/28), Accredited Representatives (round 29), and the Get Help hub + full nav surfacing (round 31) are all built and live.** Real gap found on the same check: round 29 shipped with its directory table **empty** — the DOJ-roster seed data specified below never actually populated it, and the "free" messaging + two nav-placement corrections also landed after round 31 had already shipped, so neither made it live either. All three are now a follow-up task (`round29-followup-seed-and-messaging-gaps.md`), not a new build. Entity types 3-6 remain unauthorized — need an explicit go-ahead each. Two decisions Peter made explicitly (Sep 8), superseding the first draft of this doc: **(1) all of Track A, B, and C become real, in-app, user-facing entities inside CaseWhy itself** — not just an outbound marketing funnel that recruits partners who then sit off to the side; **(2) each entity type gets its own fully separate system** (own table, own public page, own application/intake flow) rather than one shared directory filtered by type. This is a bigger build than the original single-directory version, so it's broken into a sequenced backlog rather than one round.

## Why this matters beyond the email campaign

The original framing was outbound-only: recruit attorneys via email, get them listed. Peter's extension makes this a real product value-add — CaseWhy itself becomes the place a user goes to find an attorney, free legal help, their school's international office, a community organization, or (for an employer) a way to sponsor their team, all as first-class features inside the app, not just landing pages that exist to convert cold-email traffic.

## Free, on both sides — confirmed Sep 8, and needs to be said out loud everywhere, not just true in the code

Two separate "is this free" questions, both resolved: **(1) free for users to access** — the whole Get Help hub is a public page, no sign-in, never Plus-gated, same posture as CW-39's "the stalled-case awareness card is free on every tier." **(2) free for the listed party** — decided explicitly for attorneys (`attorney-referral-directory-concept.md` Phase 1: "nobody paying to be listed, no fee changing hands"), inherited by default for accredited reps (round 29, no natural fee step since DOJ's own public roster is the data source), and always assumed for legal aid orgs/DSOs/community orgs (never framed as a revenue lever). Employers is the one exception in kind — submitting interest is free, but the eventual team-accounts feature itself is a separate, undecided future monetization question. A **paid Phase 2** exists only as a scoped-but-unauthorized idea for attorney listings, gated on a legal review that hasn't started — nothing else has a paid version even proposed.

**Peter's direct instruction (Sep 8): this needs to be surfaced clearly, not left as an internal fact.** Concretely, "free" should appear:

- **On the Get Help hub page itself**, near the top, alongside the existing "informational listing, not an endorsement" disclaimer — something like "Every resource here is free to use, always — no fees, no ads, no hidden cost."
- **On each entity type's own `/<type>` page** — same short restatement, not just implied by absence of a price.
- **On each `/<type>/join` application page** — reassure the party applying to be listed, explicitly, that there's no cost to join. This matters most for attorneys and orgs sizing up whether this is a pitch in disguise; "free founding partner" is already the campaign's framing (`attorney-email-campaign-concept.md`) but the actual page copy needs to say it plainly, not leave it implied by the word "founding."
- **In the outbound attorney email campaign and on `casewhyhub.com`'s landing pages** — the recruiting pitch already assumes "free," but the actual email/landing copy needs the word in it, not just in internal planning docs.
- **On the CaseWhy Plus `/plus` marketing page** — explicit clarification that Get Help is not a Plus perk; it's free to everyone regardless of subscription. Otherwise a prospective Plus subscriber (or a free-tier user who never subscribes) could reasonably assume it's paywalled, which undercuts the point.
- **Tied into the existing "no ads, ever" trust narrative** — `attorney-referral-directory-concept.md` already established that *not* running ads is itself a trust-marketing line (same move VisaWatch made). "Free help directory, no ads, no fees" is one cohesive trust pillar, not a scattered feature footnote — worth writing it that way in any marketing copy (site, social, campaign) rather than mentioning "free" once and moving on.

None of the entity-type build tasks below are marked done yet, so this messaging requirement rides along with each one as it gets built, rather than as a separate retrofit pass.

## Architecture: separate systems, consistent template

Six entity types, each fully separate (own table, own public listing page, own application form, own review/notification path) per Peter's explicit call — but built from one repeatable template so six separate systems doesn't mean six bespoke designs:

- A table: `<type>_directory` (public, approved entries only) + `<type>_applications` (submissions awaiting review) — same split round 27/28 already established for attorneys (`directory.ts` / `attorney_applications`).
- A public listing page at `/<type>` with the same "informational listing, not an endorsement" disclaimer language already used on `/attorneys`, plus the "this is free" line described above.
- **Every entry gets its own permalink** — `/<type>/<slug-or-id>` — not just a card on the `/<type>` index page. Decided Sep 8: applies to all six entity types uniformly, no exceptions. Worth a real check on whether round 27/28's attorney directory already does this or only renders cards inline on `/attorneys` — if the latter, add individual attorney permalinks as a small follow-up rather than assuming it's already covered.
- A self-enroll application page at `/<type>/join` with type-appropriate fields, plus the "free to join" reassurance described above.
- A notification to Peter on each new submission — no per-type admin dashboard needed at this volume, same as round 28's approach.
- Nothing auto-populates a public listing; every entry is manually vetted before it's visible, same principle across all six.

**A single "Get Help" hub page** ties all six together for discoverability — without it, six separate, unlinked pages would be nearly impossible for a real user to find. It presents each live category as its own card/section: Attorneys, Accredited Representatives, Free & Low-Cost Legal Help, Community Organizations, Student Resources, For Employers. A category with zero approved entries yet shows a graceful fallback (same pattern round 27 already built for `/attorneys` — falls back to linking AILA's own directory) rather than a bare empty state.

### Where "Get Help" is surfaced — full map, not just the hub page itself

The hub is only as useful as its discoverability, and `casewhy.com` and `app.casewhy.com` are two separate codebases (static `main` branch vs. the Next.js app) with their own navs and footers, so this needs to be concrete about each surface rather than a single line:

1. **`casewhy.com` root nav** (static pre-launch site) — a real "Get Help" nav item, alongside the "Sign in" link already added there. The directory content is public and needs no sign-in, so this has real standalone value even to a visitor who never signs up, and it gives the pre-launch "Coming soon" page something substantive to show besides two email-capture forms. Since the directory itself lives in the Next.js app repo, this link crosses domains to `app.casewhy.com/get-help` — same cross-domain pattern already used for the "Sign in" link.
2. **`casewhy.com` footer** — add "Get Help" alongside Privacy/Terms/Contact, same persistent-low-friction logic as those.
3. **`app.casewhy.com`'s own landing page footer** (`src/app/page.tsx`) — already Privacy/Contact/Terms (three items); "Get Help" is a natural fourth, same treatment as when Terms of Service was added.
4. **The signed-in app nav** (`AuthHeader.tsx`) — add "Get Help," positioned immediately after "CaseWhy Plus" in the nav order (Peter's explicit placement instruction, Sep 8). Without this, discoverability for a signed-in user depends entirely on hitting one of the contextual moments below — a persistent nav item means it isn't only findable at a moment of crisis.
4a. **The signed-out top nav on `app.casewhy.com`** — decided Sep 8: "Get Help" belongs in the top menu here too, not just the landing-page footer (item 3 above) — additive, not a replacement for the footer link. Whatever renders as the header for a signed-out visitor (may or may not be the same component as the signed-in nav) needs its own "Get Help" entry.
5. **Dashboard explanation** — wherever the status explanation currently gestures at "consult an attorney" (CW-31's guardrails allow this when the facts support it), that becomes a real link to the hub instead of inert text.
6. **Chat (CW-32) guardrail redirects** — the adversarial-question guardrails already redirect toward an attorney or legal aid in some cases (the fraud question, the "pay the officer" question, per CW-32's own testing) — those redirects link to the hub rather than just naming the idea in prose.
7. **Escalation toolkit (CW-39)** — the "your case looks delayed" card and the letter-drafting tools are the closest-adjacent moment: someone drafting a congressional inquiry letter is exactly who'd also want a real attorney or legal aid org, so a "Get Help" CTA belongs directly in that flow.
8. **Replaces the current single "find an attorney" link** wherever it actually lives in the codebase today — this doc references it but doesn't name the file; Claude Code should locate it directly when this gets built rather than guess.
9. **Settings/footer, for Employers specifically** — already decided separately (see entity #6 below): the "For Employers" lead-capture page is reachable from Settings/footer, so that surface point is already spoken for.

None of this is authorized to build yet — it's the spec to work from once the hub itself (and entity types 3-6) get greenlit, same posture as the rest of this backlog.

## The six entity types and sequencing

1. **Attorneys** — live (round 27/28).
2. **BIA-accredited representatives** — non-lawyer, DOJ-authorized representatives, typically at nonprofits. Same shape as attorneys (name, organization, credential info in place of a bar number, practice focus, contact) but its own separate table/page/flow per Peter's call, not a field on the attorney form. **Round 29, greenlit, next up.**
3. **Legal aid / nonprofit immigration organizations** — reach users who can't afford a private attorney; genuinely press-worthy alongside the founder story. Fields: org name, org type, contact person, population/regions served, services offered.
4. **University international student offices (DSOs)** — F-1 students filing OPT/STEM OPT (I-765, already covered) go through these constantly. Fields: school name, office name, contact, student population served.
5. **Community and cultural organizations, churches with immigrant congregations** — grassroots trust channel. Fields: org name, community served, contact, what kind of support they offer.
6. **Employers / HR & mobility teams** — different in kind: there's no multi-employee/team account feature built yet, so this can't honestly be a "browsable directory" the way the other five are. The in-app entity here is a "For Employers" page (still a real page inside CaseWhy, reachable from Settings/footer) explaining the value for teams and capturing interest (company name, rough team size, contact, free-text needs) — a lead-capture form, not a public listing. Submissions are product-research/sales leads, not directory entries, until an actual team feature is scoped and built.

**Recommended build order after round 29:** legal aid orgs (3) next — lowest risk, highest immediate value given asylum/DACA users who can't afford attorneys — then university DSOs (4) and community orgs (5) in either order, with employers (6) last since it depends on a product decision (team accounts) that doesn't exist yet.

## Can any tables be seeded with a real baseline, instead of starting empty? Researched Sep 8

Checked this directly (real government sources fetched, not assumed) rather than treating all six as equally dependent on outbound recruitment:

**Attorneys — deliberately not seeded.** The whole "founding partner" model depends on an attorney knowingly opting in (self-enroll + bar-lookup vetting) — pre-populating real attorneys' names without their knowledge risks reading as an implied CaseWhy affiliation that doesn't exist, and would undercut the outreach campaign already in motion. Leave this to the existing funnel.

**BIA-accredited representatives (round 29) — yes, a real baseline exists.** DOJ's EOIR publishes an official, current [Recognized Organizations and Accredited Representatives Roster](https://www.justice.gov/eoir/page/file/942301/download). The address-inclusive combined roster is what round 29 seeds from — see `round29-accredited-reps-build-and-seed-task.md` for the full build+seed task, including why a plain web-fetch summarization pass isn't reliable enough for this (tried it directly, got a stale 2016 mirror on one attempt and a truncated result on another) and why it needs real PDF-parsing code instead. Filtered Florida-first, matching the same "go local first" logic already used for attorney outreach.

**Legal aid / nonprofit organizations (3) — partially, with one real catch, not a clean yes.** EOIR separately publishes a quarterly [List of Pro Bono Legal Service Providers](https://www.justice.gov/eoir/list-pro-bono-legal-service-providers) (Jan/Apr/Jul/Oct), covering nonprofits and attorneys committing 50+ pro bono hours/year. It carries an explicit stated restriction: *"The List is not to be used by organizations or attorneys for the purpose of solicitation for paid legal services."* Whether a for-profit product surfacing this list as a free directory feature (adjacent to a paid subscription elsewhere in the app) trips that is a genuine gray area — worth folding into the legal review already deferred for the attorney directory (Florida Bar Rule 4-7.22), not assumed clear. **Safer starting point:** the *recognized organizations* side of the EOIR roster above (the nonprofits employing accredited reps) overlaps heavily with this category and doesn't carry that explicit restriction — usable now without the same open question.

**University DSOs (4) — not really.** ICE's SEVP publishes which schools are certified to enroll F-1 students, but not a downloadable directory of actual international-office contact info — still means real per-school lookups, closer to manual curation than a one-time download.

**Community/cultural orgs and churches (5) — no.** No official directory exists; inherently local, needs real curation, same as the attorney directory's own "go local first" recommendation.

**Employers (6) — n/a.** Lead-capture form, not a directory — nothing to seed.

## Domain structure for the outbound side (email campaign)

**Domain registered: `casewhyhub.com`** (Cloudflare Registrar, same registrar as `casewhy.com`). Picked over alternatives like `casewhypartners.com` / `casewhyconnect.com` and over a "Corporate & Portal"-style name (`casewhyhq.com`, `casewhyportal.com`) because this domain's job is landing in an attorney's or nonprofit's inbox reading as legitimate, professional outreach — not a growth-hacking tool. That matters doubly given CaseWhy's own brand is built on *not* running scrappy growth-marketing plays at anxious immigrants: "Hub" is neutral and accurately describes a central point for multiple partner tracks, where "Grow," "Portal," "HQ," etc. either oversell what's currently a lean, one-founder operation or read more like a SaaS acquisition funnel.

**Routing: path-based on the root domain, no subdomain layer.** `casewhyhub.com/attorneys`, `/organizations`, `/employers` — not `partners.casewhyhub.com/...`. A `partners.` (or similar) subdomain in front of a name like `casewhyhub.com` would be redundant, and more importantly, splitting the campaign across a root domain and a subdomain means warming up and monitoring sender/domain reputation in two places instead of one. One domain, path-based routing, one thing to warm up.

These campaign pages funnel into the in-app application pages described above (`app.casewhy.com/attorneys/join`, `/accredited-representatives/join`, etc.) — same split already established; only the *marketing* side lives on `casewhyhub.com`.

**Next steps now that it's registered:** point `casewhyhub.com`'s DNS at Cloudflare (same pattern as `casewhy.com`), then add SPF/DKIM/DMARC records once a cold-outreach sending tool is picked (see `attorney-email-campaign-concept.md`) — the actual send is still gated on the LLC's physical-address requirement (CAN-SPAM), not on the domain. This DNS setup has been handed to Claude Code (see `casewhyhub-dns-setup-task.md`).

## What's authorized right now

Round 29 (accredited representatives) and the "Get Help" hub/nav task (round 31) are both built and live — but round 29's baseline seed data, the "free" messaging, and two nav-placement fixes still need to actually land; see `round29-followup-seed-and-messaging-gaps.md`. Beyond that cleanup, the next new thing in the queue is legal aid orgs (entity type 3, see "Recommended build order" above) — still unauthorized, needs an explicit go-ahead. Entity types 4-6 remain further behind that.
