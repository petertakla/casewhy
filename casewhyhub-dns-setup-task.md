# New task for Claude Code — set up casewhyhub.com DNS at Cloudflare

**Status: ready to hand off — casewhyhub.com is registered (Sep 8, Cloudflare Registrar, same registrar as casewhy.com).** This is the sending/marketing domain for the attorney email campaign (`attorney-email-campaign-concept.md`), kept deliberately separate from casewhy.com so a spam complaint or bounce spike from cold outreach can't touch the app's real transactional email (magic links, status-change alerts). Full domain-name reasoning and the path-based-routing decision (`casewhyhub.com/attorneys`, `/organizations`, `/employers` — no `partners.` subdomain) are in `partner-marketing-domain-concept.md`.

## Why Claude Code, not a Peter-only step

Claude Code already has Cloudflare access on this account — it added the DKIM/Return-Path DNS records directly at Cloudflare for `casewhy.com`'s Postmark domain verification (see CLOUD_CLAUDE.md, Sep 5 entry: "Claude Code added directly at Cloudflare... both records resolving correctly... Verified on the first retry"). Same access should cover `casewhyhub.com` since it's registered on the same Cloudflare account. Confirm that assumption is still true before proceeding, and flag plainly rather than guess if it isn't.

## What needs to happen now (do this part now)

1. **Confirm `casewhyhub.com` is showing as an active zone in the Cloudflare dashboard/API** — registering through Cloudflare Registrar normally auto-creates the DNS zone, but verify rather than assume.
2. **Point the domain somewhere sane for now** — it doesn't need a real site yet (the actual `/attorneys`, `/organizations`, `/employers` landing pages aren't built), so a simple placeholder is fine: either a basic "coming soon" redirect/page, or just leave it unresolved with no A/CNAME record until the landing pages exist. Don't spend real build time on a placeholder page unless Peter asks — just make sure the zone itself is live and correctly delegated to Cloudflare's nameservers (check the registrar's nameserver assignment matches what Cloudflare expects, same as any new zone).
3. **Do NOT set up SPF/DKIM/DMARC yet.** Those records are specific to whichever cold-outreach sending tool ends up being used (Apollo.io's built-in sender, Instantly, Smartlead, lemlist, etc. — see `attorney-email-campaign-concept.md`, still an open item, not yet confirmed by Peter), and each tool hands you its own exact records to add. Setting these up before the tool is picked would mean redoing them.

## What's still blocked (don't start yet)

- SPF/DKIM/DMARC + sender warm-up — blocked on the sending-tool decision (Apollo.io recommended, not yet confirmed).
- The actual campaign send — separately blocked on the Florida LLC getting a real registered address for CAN-SPAM's physical-address requirement (~Sep 22-24, 2026), per `attorney-email-campaign-concept.md`.
- The `/attorneys`, `/organizations`, `/employers` marketing landing pages themselves aren't scoped as a build task yet — this task is DNS/domain plumbing only.

## Handoff note

Please fold this into `CLOUD_CLAUDE.md` once picked up (same standing-handoff pattern as everything else in that file), and report back what was found for the zone/nameserver check in step 1.
