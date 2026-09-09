# Can we populate `/attorneys` ourselves? — research findings (Sep 9)

**Status: research only, not a task doc.** Peter's ask: now that round 39's exact disclaimer language ("does not constitute a lawyer referral service, and listing does not imply an endorsement or recommendation") is queued, find out if/how we can self-populate the attorney directory the way accredited representatives and legal aid orgs were — a real, bulk, government-sourced pull — instead of leaving `/attorneys` empty until self-enrollment fills it in.

## Bottom line

**There's no attorney equivalent of the DOJ EOIR roster.** Confirmed directly from EOIR's own policy manual: any attorney licensed and in good standing in any U.S. state is automatically authorized to appear before immigration court — there's no separate accreditation step (that's only for non-attorney accredited representatives) and no resulting public roster. EOIR's `eRegistry` is an internal administrative registration system, not a published directory. So the exact playbook round 32/34/35 used (one federal PDF, parse it, done) doesn't have an attorney-side counterpart.

But there is a real, legitimate, and fairly close analog: **state bar board-certification directories.**

## The best option found: official state-bar board certification in immigration law

Several states run a formal "board certified specialist" program specifically for immigration law, administered directly by the state bar (a state-created regulatory body, not a private company) — the same category of "official record" as the DOJ roster, just at the state level instead of federal:

- **Florida** — "Board Certified in Immigration and Nationality Law," administered by The Florida Bar. Public, searchable directory at `floridabar.org/about/cert/cert-im-mbrs/`: 74 attorneys as of this check, paginated, includes name, bar number, firm name/address, phone, fax, email, and photo where available.
- **Texas** — Texas Board of Legal Specialization certifies "Immigration and Nationality Law" as well.
- **North Carolina** — the NC State Bar Board of Legal Specialization also certifies "Immigration Law," with its own public specialist directory.

I didn't find certification programs for immigration law in other states beyond these three in this pass — most state bars don't offer a formal immigration-law specialty certification at all (it's a smaller list of specialties than something like "family law" or "criminal law" gets in most states), so this approach tops out at a few hundred attorneys nationwide, not thousands. That's a real limitation, but the trade-off is quality: "board-certified specialist" is a much stronger trust signal to put in front of a user than "self-tagged practice area," and it directly reinforces Get Help's whole positioning (accurate, vetted-where-possible information, not a scraped pile of leads).

**On legality/terms of use:** I checked The Florida Bar's general website Terms of Use (`floridabar.org/home/terms-of-use/`) directly — it has no explicit language prohibiting scraping, bulk use, or redistribution of directory data; the only relevant clause is a generic "don't damage or overburden the site" technical restriction. The directory page itself carries a standard site copyright notice, which under general copyright principles (*Feist v. Rural Telephone*) would protect the Bar's own compilation/presentation, not the underlying facts (a name, bar number, or phone number is not copyrightable). I have **not** checked Texas's or North Carolina's specific site terms yet — that's a real next step before building anything, same "verify per state, don't assume it's the same everywhere" discipline round 32/35 already established for the DOJ data.

## What I'd recommend NOT scraping

**AILA's "Find an Immigration Lawyer" directory, and general aggregators like Avvo, Martindale-Hubbell, FindLaw, or Justia's lawyer directories.** These aren't official/regulatory sources — they're other companies' proprietary, curated products (AILA is a private membership association; the others are commercial legal-marketing directories). Scraping and republishing their data as a competing directory is a meaningfully different and riskier act than pulling from a state bar's own public certification records — real ToS/breach-of-contract exposure, and it's copying a competitor's product rather than surfacing an official record. Worth explicitly ruling out rather than leaving ambiguous.

## What this doesn't touch: the general "self-reported practice area" bar directories

Separately from board certification, Florida's regular "Find a Lawyer" directory (and most other states' general bar directories) let *any* member self-tag "Immigration and Nationality" as a practice area — a much bigger list, but self-reported and unverified, meaning it includes every attorney who's ever dabbled in an immigration matter, not people who've demonstrated specialty competence. Bigger volume, weaker signal, and — since it's 50 separate state bar sites instead of one federal PDF — 50 separate terms-of-use and site-structure checks instead of one. I'd treat this as a possible *later* expansion, not the first move.

## Suggested path

1. **Seed `/attorneys` now with the board-certified specialists from Florida, Texas, and North Carolina** — small (likely low hundreds total), high-trust, sourced from official state bar records, cited exactly like the DOJ roster ("Source: The Florida Bar, Immigration & Nationality Law certification directory, pulled [date]"), same table/permalink/state-filter/disclaimer pattern already standard for every other entity type.
2. **Confirm Texas's and North Carolina's site terms of use don't say anything Florida's doesn't** before building the actual parser — quick check, not a blocker, just don't skip it.
3. **Self-enrollment (`/attorneys/join`) stays the primary long-run growth path** for everyone outside those three states' certified lists — which is exactly what the cold-email campaign (`attorney-email-campaign-concept.md`) is already built to drive, once it's unblocked on the Florida LLC's registered address (~Sep 22-24).
4. This keeps `/attorneys` from sitting empty in the meantime without reaching for a scrape of AILA or a commercial directory to do it.

**Standard caveat, since this is a real compliance judgment call:** this is my research, not legal advice — I didn't find a hard blocker in what I checked, but "no explicit prohibition found in a terms-of-use page" isn't the same as "cleared." Worth a specific look from the immigration lawyer at the single end-of-development review (or sooner, if you'd rather not build then find out there's an issue) — flagging this explicitly rather than letting it slide by as "already resolved" just because the wording search came back clean.

## If you want to proceed

I'd write this up as the next entity-type-style task doc (same shape as round 34's legal aid orgs doc: build the standard template if any pieces are missing, then parse + migrate + seed against production, state-by-state) — say the word and I'll draft it.
