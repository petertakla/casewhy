# New task for Claude Code — round 38: give "Get Help" a real content section on the static marketing site

**Status: authorized now.** Peter's direct call: "Get Help" is a genuine differentiator versus the competition (Lawfully, US Case Tracker, VisaWatch all just poll and show status — none of them connect a user to a real attorney, accredited representative, or legal aid org) and it's currently under-sold on `casewhy.com` (the static pre-launch marketing site, `main` branch) — today it's just a nav link and a footer link, with no actual content explaining what it is or why it matters. This adds a real section to the homepage itself.

## Where it goes

`casewhy.com`'s `index.html`, as a new section alongside the existing ones (per `CLOUD_CLAUDE.md`'s "Key files" notes: the 12M-pending-cases backlog-stats section, the Track/Understand/Act three-step feature grid, the "built to be trusted" disclaimer section, email-capture CTAs). Place it **after the Track/Understand/Act grid and before (or as part of) the "built to be trusted" section** — it's a natural extension of "Act": tracking tells you what's happening, Get Help is what you do about it when you need more than the app can tell you.

## Content — draft copy below, adjust for tone/length as needed to fit the page's existing voice

**Section headline:** "More than a tracker — real help, free" (or similar; keep the "free" word in the headline or subhead, not buried — this is the same "free, always" trust positioning already required everywhere else Get Help appears).

**Intro line (1-2 sentences):** Something like: "Other case trackers stop at a status update. CaseWhy connects you to real help — attorneys, accredited representatives, and free legal aid — built into the app, free to use, with no ads and no fees, ever."

**Include all six entity types if space allows** (per `partner-marketing-domain-concept.md`'s "six entity types" list) — a compact grid or list, not a long paragraph per type. Suggested one-line description for each, and mark accurately which are live today vs. coming soon (**check current status before publishing — do not overclaim; the two "live" ones below are confirmed as of Sep 8, but legal aid orgs is actively in progress under round 34 and may have shipped by the time this task is picked up**):

1. **Attorneys** — *live* — "Vetted immigration attorneys, free to browse, free to be listed."
2. **Accredited representatives** — *live, nationwide* — "DOJ-accredited representatives in all 50 states, sourced directly from official government records."
3. **Legal aid & nonprofit organizations** — *coming soon (check round 34's status — flip to live + link if it has shipped by the time this task starts)* — "Free and low-cost legal help for those who need it most."
4. **University international student offices** — *coming soon* — "Find your school's DSO for F-1/OPT support."
5. **Community & cultural organizations** — *coming soon* — "Local, trusted organizations that understand your community."
6. **For employers** — *coming soon* — "Sponsoring or relocating employees? We can help."

If six feels like too much for the homepage's existing visual rhythm, it's fine to show the two live ones prominently and group the remaining four as a shorter "and more coming soon" line — use judgment on what fits the page's existing density, but don't drop the "six types, more coming" framing entirely, since the breadth itself is part of the differentiation story.

**CTA:** A real button/link, "Explore Get Help →", pointing to `https://app.casewhy.com/get-help` — same cross-domain pattern already used for "Sign in" and the existing Get Help nav/footer links.

## Keep it honest and current

This section makes real claims (nationwide coverage, specific entity types, free-always) — before shipping, verify against `CLOUD_CLAUDE.md`'s actual current status (rounds 34/35/36) rather than the description in this task doc, in case something has shipped or changed between when this was written and when it's built. Don't claim something is live that isn't, and don't undersell something that already is (accredited representatives is nationwide now, not Florida-only — make sure the copy reflects that, not an older assumption).

## Verify live

Section renders correctly on `casewhy.com`, matches the site's existing visual style (not a jarring bolt-on), CTA link works and lands on `app.casewhy.com/get-help`, mobile-responsive (check the existing mobile nav/CSS patterns this site already uses). Report back and fold into `CLOUD_CLAUDE.md`'s standing status per the usual handoff pattern.
