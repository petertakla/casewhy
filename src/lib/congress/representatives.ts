// CW-39 — congressional representative directory. Same "curated,
// periodically refreshed" pattern as CW-31/33/34's knowledge base, on a
// ~2-year (election-cycle) refresh cadence, not monthly.
//
// NATIONAL COVERAGE, Sep 6 2026: expanded from the original Florida-only
// pilot (which shipped as a deliberate first slice, not a final scope —
// see git history) to all 50 states: 100 senators + 435 House seats.
//
// Sourcing and verification:
//  - All 100 senators: pulled from the Senate's own official XML contact
//    feed (senate.gov/general/contact_information/senators_cfm.xml), which
//    includes name, party, state, DC office phone, and official website
//    for every sitting senator. Cross-checked count (2 per state, 100
//    total, zero states missing) programmatically, and independently
//    verified one surprising entry (OK's Alan Armstrong, a 2026
//    gubernatorial appointment not in most models' training data) against
//    three independent sources before trusting it.
//  - All 435 House seats: house.gov's own representatives directory was
//    tried first, but a bulk fetch of that page was caught fabricating
//    several entries once the real page content ran out (it invented a
//    3rd West Virginia district — WV has had only 2 since 2020
//    redistricting — and misattributed several members to the wrong
//    state). That fabricated batch was thrown out and every affected
//    state was re-sourced individually, state by state, and the full
//    result checked programmatically against the correct seat count for
//    every state before use. TX-23 and FL-20 are the two genuine
//    exceptions, matching the two vacancies confirmed live against
//    Wikipedia's current-members page ("As of September 2, 2026, there
//    are 433 representatives and 2 vacancies") during a later pass, Sep 6
//    evening: Tony Gonzales (TX-23) resigned April 14, 2026, and Sheila
//    Cherfilus-McCormick (FL-20) resigned April 21, 2026; neither special
//    election has been held yet. FL-20 was initially shipped with a stale
//    entry for the resigned member — caught and removed during a
//    cross-check against an independent current-legislators dataset, a
//    real reminder that even a carefully-sourced snapshot needs a fresh
//    vacancy check, not just a one-time seat-count validation.
//
// HONEST LIMITATION, Sep 6 2026 — House phone/website not yet verified
// per-member: the Senate's contact feed conveniently bundles phone and
// website with every entry; there's no equivalent single official source
// for the House. Rather than guess an individual "lastname.house.gov"
// URL (a real risk — plenty of members don't follow that pattern) or a
// direct DC line, every House entry below uses the Capitol switchboard
// (202-224-3121, which correctly reaches any member's office, same
// fallback already accepted for the original Rick Scott entry) and the
// official House member-lookup page as its website. This is a real,
// tracked gap, not a hidden one — see CLOUD_CLAUDE.md for the follow-up
// item to verify each member's actual direct line and website.
export interface RepresentativeEntry {
  chamber: "senate" | "house";
  state: string; // USPS postal abbreviation
  /** House only — two-digit district number as Census returns it (e.g. "02"). */
  district?: string;
  name: string;
  party: string;
  website: string;
  /** DC office direct line if confirmed; the Capitol switchboard otherwise (always correct, just not direct). */
  phone: string;
  contactFormUrl?: string;
}

export const REPRESENTATIVES_AS_OF = "2026-09-06";

export const REPRESENTATIVES: RepresentativeEntry[] = [
  {
    chamber: "senate",
    state: "FL",
    name: "Ashley Moody",
    party: "R",
    website: "https://www.moody.senate.gov/",
    phone: "202-224-3041",
    contactFormUrl: "https://www.moody.senate.gov/contact-us/",
  },
  {
    chamber: "senate",
    state: "FL",
    name: "Rick Scott",
    party: "R",
    website: "https://www.rickscott.senate.gov",
    // Direct DC line not confirmed as of this writing — the Capitol
    // switchboard reaches any member's office and is always correct.
    phone: "202-224-3121",
    contactFormUrl: "https://www.rickscott.senate.gov/contact/contact",
  },
  {
    chamber: "senate",
    state: "MD",
    name: "Angela D. Alsobrooks",
    party: "D",
    website: "https://alsobrooks.senate.gov",
    phone: "202-224-4524",
  },
  {
    chamber: "senate",
    state: "OK",
    name: "Alan Armstrong",
    party: "R",
    website: "https://www.armstrong.senate.gov",
    phone: "202-224-4721",
  },
  {
    chamber: "senate",
    state: "WI",
    name: "Tammy Baldwin",
    party: "D",
    website: "https://www.baldwin.senate.gov",
    phone: "202-224-5653",
  },
  {
    chamber: "senate",
    state: "IN",
    name: "Jim Banks",
    party: "R",
    website: "https://www.banks.senate.gov",
    phone: "202-224-4814",
  },
  {
    chamber: "senate",
    state: "WY",
    name: "John Barrasso",
    party: "R",
    website: "https://www.barrasso.senate.gov",
    phone: "202-224-6441",
  },
  {
    chamber: "senate",
    state: "CO",
    name: "Michael F. Bennet",
    party: "D",
    website: "https://www.bennet.senate.gov",
    phone: "202-224-5852",
  },
  {
    chamber: "senate",
    state: "TN",
    name: "Marsha Blackburn",
    party: "R",
    website: "https://www.blackburn.senate.gov",
    phone: "202-224-3344",
  },
  {
    chamber: "senate",
    state: "CT",
    name: "Richard Blumenthal",
    party: "D",
    website: "https://www.blumenthal.senate.gov",
    phone: "202-224-2823",
  },
  {
    chamber: "senate",
    state: "DE",
    name: "Lisa Blunt Rochester",
    party: "D",
    website: "https://www.bluntrochester.senate.gov",
    phone: "202-224-2441",
  },
  {
    chamber: "senate",
    state: "NJ",
    name: "Cory A. Booker",
    party: "D",
    website: "https://www.booker.senate.gov",
    phone: "202-224-3224",
  },
  {
    chamber: "senate",
    state: "AR",
    name: "John Boozman",
    party: "R",
    website: "https://www.boozman.senate.gov",
    phone: "202-224-4843",
  },
  {
    chamber: "senate",
    state: "AL",
    name: "Katie Boyd Britt",
    party: "R",
    website: "https://www.britt.senate.gov",
    phone: "202-224-5744",
  },
  {
    chamber: "senate",
    state: "NC",
    name: "Ted Budd",
    party: "R",
    website: "https://www.budd.senate.gov",
    phone: "202-224-3154",
  },
  {
    chamber: "senate",
    state: "WA",
    name: "Maria Cantwell",
    party: "D",
    website: "https://www.cantwell.senate.gov",
    phone: "202-224-3441",
  },
  {
    chamber: "senate",
    state: "WV",
    name: "Shelley Moore Capito",
    party: "R",
    website: "https://www.capito.senate.gov",
    phone: "202-224-6472",
  },
  {
    chamber: "senate",
    state: "LA",
    name: "Bill Cassidy",
    party: "R",
    website: "https://www.cassidy.senate.gov",
    phone: "202-224-5824",
  },
  {
    chamber: "senate",
    state: "ME",
    name: "Susan M. Collins",
    party: "R",
    website: "https://www.collins.senate.gov",
    phone: "202-224-2523",
  },
  {
    chamber: "senate",
    state: "DE",
    name: "Christopher A. Coons",
    party: "D",
    website: "https://www.coons.senate.gov",
    phone: "202-224-5042",
  },
  {
    chamber: "senate",
    state: "TX",
    name: "John Cornyn",
    party: "R",
    website: "https://www.cornyn.senate.gov",
    phone: "202-224-2934",
  },
  {
    chamber: "senate",
    state: "NV",
    name: "Catherine Cortez Masto",
    party: "D",
    website: "https://www.cortezmasto.senate.gov",
    phone: "202-224-3542",
  },
  {
    chamber: "senate",
    state: "AR",
    name: "Tom Cotton",
    party: "R",
    website: "https://www.cotton.senate.gov",
    phone: "202-224-2353",
  },
  {
    chamber: "senate",
    state: "ND",
    name: "Kevin Cramer",
    party: "R",
    website: "https://www.cramer.senate.gov",
    phone: "202-224-2043",
  },
  {
    chamber: "senate",
    state: "ID",
    name: "Mike Crapo",
    party: "R",
    website: "https://www.crapo.senate.gov",
    phone: "202-224-6142",
  },
  {
    chamber: "senate",
    state: "TX",
    name: "Ted Cruz",
    party: "R",
    website: "https://www.cruz.senate.gov",
    phone: "202-224-5922",
  },
  {
    chamber: "senate",
    state: "UT",
    name: "John R. Curtis",
    party: "R",
    website: "https://www.curtis.senate.gov",
    phone: "202-224-5251",
  },
  {
    chamber: "senate",
    state: "MT",
    name: "Steve Daines",
    party: "R",
    website: "https://www.daines.senate.gov",
    phone: "202-224-2651",
  },
  {
    chamber: "senate",
    state: "IL",
    name: "Tammy Duckworth",
    party: "D",
    website: "https://www.duckworth.senate.gov",
    phone: "202-224-2854",
  },
  {
    chamber: "senate",
    state: "IL",
    name: "Richard J. Durbin",
    party: "D",
    website: "https://www.durbin.senate.gov",
    phone: "202-224-2152",
  },
  {
    chamber: "senate",
    state: "IA",
    name: "Joni Ernst",
    party: "R",
    website: "https://www.ernst.senate.gov",
    phone: "202-224-3254",
  },
  {
    chamber: "senate",
    state: "PA",
    name: "John Fetterman",
    party: "D",
    website: "https://www.fetterman.senate.gov",
    phone: "202-224-4254",
  },
  {
    chamber: "senate",
    state: "NE",
    name: "Deb Fischer",
    party: "R",
    website: "https://www.fischer.senate.gov",
    phone: "202-224-6551",
  },
  {
    chamber: "senate",
    state: "AZ",
    name: "Ruben Gallego",
    party: "D",
    website: "https://www.gallego.senate.gov",
    phone: "202-224-4521",
  },
  {
    chamber: "senate",
    state: "NY",
    name: "Kirsten E. Gillibrand",
    party: "D",
    website: "https://www.gillibrand.senate.gov",
    phone: "202-224-4451",
  },
  {
    chamber: "senate",
    state: "SC",
    name: "Darline Graham",
    party: "R",
    website: "https://www.dgraham.senate.gov",
    phone: "202-224-5972",
  },
  {
    chamber: "senate",
    state: "IA",
    name: "Chuck Grassley",
    party: "R",
    website: "https://www.grassley.senate.gov",
    phone: "202-224-3744",
  },
  {
    chamber: "senate",
    state: "TN",
    name: "Bill Hagerty",
    party: "R",
    website: "https://www.hagerty.senate.gov",
    phone: "202-224-4944",
  },
  {
    chamber: "senate",
    state: "NH",
    name: "Margaret Wood Hassan",
    party: "D",
    website: "https://www.hassan.senate.gov",
    phone: "202-224-3324",
  },
  {
    chamber: "senate",
    state: "MO",
    name: "Josh Hawley",
    party: "R",
    website: "https://www.hawley.senate.gov",
    phone: "202-224-6154",
  },
  {
    chamber: "senate",
    state: "NM",
    name: "Martin Heinrich",
    party: "D",
    website: "https://www.heinrich.senate.gov",
    phone: "202-224-5521",
  },
  {
    chamber: "senate",
    state: "CO",
    name: "John W. Hickenlooper",
    party: "D",
    website: "https://www.hickenlooper.senate.gov",
    phone: "202-224-5941",
  },
  {
    chamber: "senate",
    state: "HI",
    name: "Mazie K. Hirono",
    party: "D",
    website: "https://www.hirono.senate.gov",
    phone: "202-224-6361",
  },
  {
    chamber: "senate",
    state: "ND",
    name: "John Hoeven",
    party: "R",
    website: "https://www.hoeven.senate.gov",
    phone: "202-224-2551",
  },
  {
    chamber: "senate",
    state: "OH",
    name: "Jon Husted",
    party: "R",
    website: "https://www.husted.senate.gov",
    phone: "202-224-3353",
  },
  {
    chamber: "senate",
    state: "MS",
    name: "Cindy Hyde-Smith",
    party: "R",
    website: "https://www.hydesmith.senate.gov",
    phone: "202-224-5054",
  },
  {
    chamber: "senate",
    state: "WI",
    name: "Ron Johnson",
    party: "R",
    website: "https://www.ronjohnson.senate.gov",
    phone: "202-224-5323",
  },
  {
    chamber: "senate",
    state: "WV",
    name: "James C. Justice",
    party: "R",
    website: "https://www.justice.senate.gov",
    phone: "202-224-3954",
  },
  {
    chamber: "senate",
    state: "VA",
    name: "Tim Kaine",
    party: "D",
    website: "https://www.kaine.senate.gov",
    phone: "202-224-4024",
  },
  {
    chamber: "senate",
    state: "AZ",
    name: "Mark Kelly",
    party: "D",
    website: "https://www.kelly.senate.gov",
    phone: "202-224-2235",
  },
  {
    chamber: "senate",
    state: "LA",
    name: "John Kennedy",
    party: "R",
    website: "https://www.kennedy.senate.gov",
    phone: "202-224-4623",
  },
  {
    chamber: "senate",
    state: "NJ",
    name: "Andy Kim",
    party: "D",
    website: "https://www.kim.senate.gov",
    phone: "202-224-4744",
  },
  {
    chamber: "senate",
    state: "ME",
    name: "Angus King",
    party: "I",
    website: "https://www.king.senate.gov",
    phone: "202-224-5344",
  },
  {
    chamber: "senate",
    state: "MN",
    name: "Amy Klobuchar",
    party: "D",
    website: "https://www.klobuchar.senate.gov",
    phone: "202-224-3244",
  },
  {
    chamber: "senate",
    state: "OK",
    name: "James Lankford",
    party: "R",
    website: "https://www.lankford.senate.gov",
    phone: "202-224-5754",
  },
  {
    chamber: "senate",
    state: "UT",
    name: "Mike Lee",
    party: "R",
    website: "https://www.lee.senate.gov",
    phone: "202-224-5444",
  },
  {
    chamber: "senate",
    state: "NM",
    name: "Ben Ray Luján",
    party: "D",
    website: "https://www.lujan.senate.gov",
    phone: "202-224-6621",
  },
  {
    chamber: "senate",
    state: "WY",
    name: "Cynthia M. Lummis",
    party: "R",
    website: "https://www.lummis.senate.gov",
    phone: "202-224-3424",
  },
  {
    chamber: "senate",
    state: "MA",
    name: "Edward J. Markey",
    party: "D",
    website: "https://www.markey.senate.gov",
    phone: "202-224-2742",
  },
  {
    chamber: "senate",
    state: "KS",
    name: "Roger Marshall",
    party: "R",
    website: "https://www.marshall.senate.gov",
    phone: "202-224-4774",
  },
  {
    chamber: "senate",
    state: "KY",
    name: "Mitch McConnell",
    party: "R",
    website: "https://www.mcconnell.senate.gov",
    phone: "202-224-2541",
  },
  {
    chamber: "senate",
    state: "PA",
    name: "David McCormick",
    party: "R",
    website: "https://mccormick.senate.gov",
    phone: "202-224-6324",
  },
  {
    chamber: "senate",
    state: "OR",
    name: "Jeff Merkley",
    party: "D",
    website: "https://www.merkley.senate.gov",
    phone: "202-224-3753",
  },
  {
    chamber: "senate",
    state: "KS",
    name: "Jerry Moran",
    party: "R",
    website: "https://www.moran.senate.gov",
    phone: "202-224-6521",
  },
  {
    chamber: "senate",
    state: "OH",
    name: "Bernie Moreno",
    party: "R",
    website: "https://www.moreno.senate.gov",
    phone: "202-224-2315",
  },
  {
    chamber: "senate",
    state: "AK",
    name: "Lisa Murkowski",
    party: "R",
    website: "https://www.murkowski.senate.gov",
    phone: "202-224-6665",
  },
  {
    chamber: "senate",
    state: "CT",
    name: "Christopher Murphy",
    party: "D",
    website: "https://www.murphy.senate.gov",
    phone: "202-224-4041",
  },
  {
    chamber: "senate",
    state: "WA",
    name: "Patty Murray",
    party: "D",
    website: "https://www.murray.senate.gov",
    phone: "202-224-2621",
  },
  {
    chamber: "senate",
    state: "GA",
    name: "Jon Ossoff",
    party: "D",
    website: "https://www.ossoff.senate.gov",
    phone: "202-224-3521",
  },
  {
    chamber: "senate",
    state: "CA",
    name: "Alex Padilla",
    party: "D",
    website: "https://www.padilla.senate.gov",
    phone: "202-224-3553",
  },
  {
    chamber: "senate",
    state: "KY",
    name: "Rand Paul",
    party: "R",
    website: "https://www.paul.senate.gov",
    phone: "202-224-4343",
  },
  {
    chamber: "senate",
    state: "MI",
    name: "Gary C. Peters",
    party: "D",
    website: "https://www.peters.senate.gov",
    phone: "202-224-6221",
  },
  {
    chamber: "senate",
    state: "RI",
    name: "Jack Reed",
    party: "D",
    website: "https://www.reed.senate.gov",
    phone: "202-224-4642",
  },
  {
    chamber: "senate",
    state: "NE",
    name: "Pete Ricketts",
    party: "R",
    website: "https://www.ricketts.senate.gov",
    phone: "202-224-4224",
  },
  {
    chamber: "senate",
    state: "ID",
    name: "James E. Risch",
    party: "R",
    website: "https://www.risch.senate.gov",
    phone: "202-224-2752",
  },
  {
    chamber: "senate",
    state: "NV",
    name: "Jacky Rosen",
    party: "D",
    website: "https://www.rosen.senate.gov",
    phone: "202-224-6244",
  },
  {
    chamber: "senate",
    state: "SD",
    name: "Mike Rounds",
    party: "R",
    website: "https://www.rounds.senate.gov",
    phone: "202-224-5842",
  },
  {
    chamber: "senate",
    state: "VT",
    name: "Bernard Sanders",
    party: "I",
    website: "https://www.sanders.senate.gov",
    phone: "202-224-5141",
  },
  {
    chamber: "senate",
    state: "HI",
    name: "Brian Schatz",
    party: "D",
    website: "https://www.schatz.senate.gov",
    phone: "202-224-3934",
  },
  {
    chamber: "senate",
    state: "CA",
    name: "Adam B. Schiff",
    party: "D",
    website: "https://www.schiff.senate.gov",
    phone: "202-224-3841",
  },
  {
    chamber: "senate",
    state: "MO",
    name: "Eric Schmitt",
    party: "R",
    website: "https://www.schmitt.senate.gov",
    phone: "202-224-5721",
  },
  {
    chamber: "senate",
    state: "NY",
    name: "Charles E. Schumer",
    party: "D",
    website: "https://www.schumer.senate.gov",
    phone: "202-224-6542",
  },
  {
    chamber: "senate",
    state: "SC",
    name: "Tim Scott",
    party: "R",
    website: "https://www.scott.senate.gov",
    phone: "202-224-6121",
  },
  {
    chamber: "senate",
    state: "NH",
    name: "Jeanne Shaheen",
    party: "D",
    website: "https://www.shaheen.senate.gov",
    phone: "202-224-2841",
  },
  {
    chamber: "senate",
    state: "MT",
    name: "Tim Sheehy",
    party: "R",
    website: "https://www.sheehy.senate.gov",
    phone: "202-224-2644",
  },
  {
    chamber: "senate",
    state: "MI",
    name: "Elissa Slotkin",
    party: "D",
    website: "https://www.slotkin.senate.gov",
    phone: "202-224-4822",
  },
  {
    chamber: "senate",
    state: "MN",
    name: "Tina Smith",
    party: "D",
    website: "https://www.smith.senate.gov",
    phone: "202-224-5641",
  },
  {
    chamber: "senate",
    state: "AK",
    name: "Dan Sullivan",
    party: "R",
    website: "https://www.sullivan.senate.gov",
    phone: "202-224-3004",
  },
  {
    chamber: "senate",
    state: "SD",
    name: "John Thune",
    party: "R",
    website: "https://www.thune.senate.gov",
    phone: "202-224-2321",
  },
  {
    chamber: "senate",
    state: "NC",
    name: "Thom Tillis",
    party: "R",
    website: "https://www.tillis.senate.gov",
    phone: "202-224-6342",
  },
  {
    chamber: "senate",
    state: "AL",
    name: "Tommy Tuberville",
    party: "R",
    website: "https://www.tuberville.senate.gov",
    phone: "202-224-4124",
  },
  {
    chamber: "senate",
    state: "MD",
    name: "Chris Van Hollen",
    party: "D",
    website: "https://www.vanhollen.senate.gov",
    phone: "202-224-4654",
  },
  {
    chamber: "senate",
    state: "VA",
    name: "Mark R. Warner",
    party: "D",
    website: "https://www.warner.senate.gov",
    phone: "202-224-2023",
  },
  {
    chamber: "senate",
    state: "GA",
    name: "Raphael G. Warnock",
    party: "D",
    website: "https://www.warnock.senate.gov",
    phone: "202-224-3643",
  },
  {
    chamber: "senate",
    state: "MA",
    name: "Elizabeth Warren",
    party: "D",
    website: "https://www.warren.senate.gov",
    phone: "202-224-4543",
  },
  {
    chamber: "senate",
    state: "VT",
    name: "Peter Welch",
    party: "D",
    website: "https://www.welch.senate.gov",
    phone: "202-224-4242",
  },
  {
    chamber: "senate",
    state: "RI",
    name: "Sheldon Whitehouse",
    party: "D",
    website: "https://www.whitehouse.senate.gov",
    phone: "202-224-2921",
  },
  {
    chamber: "senate",
    state: "MS",
    name: "Roger F. Wicker",
    party: "R",
    website: "https://www.wicker.senate.gov",
    phone: "202-224-6253",
  },
  {
    chamber: "senate",
    state: "OR",
    name: "Ron Wyden",
    party: "D",
    website: "https://www.wyden.senate.gov",
    phone: "202-224-5244",
  },
  {
    chamber: "senate",
    state: "IN",
    name: "Todd Young",
    party: "R",
    website: "https://www.young.senate.gov",
    phone: "202-224-5623",
  },
  {
    chamber: "house",
    state: "FL",
    district: "02",
    name: "Neal Dunn",
    party: "R",
    website: "https://dunn.house.gov",
    phone: "202-225-5235",
  },
  {
    chamber: "house",
    state: "AL",
    district: "01",
    name: "Barry Moore",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "02",
    name: "Shomari Figures",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "03",
    name: "Mike Rogers",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "04",
    name: "Robert Aderholt",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "05",
    name: "Dale Strong",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "06",
    name: "Gary Palmer",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AL",
    district: "07",
    name: "Terri Sewell",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AK",
    district: "00",
    name: "Nicholas Begich",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "01",
    name: "David Schweikert",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "02",
    name: "Elijah Crane",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "03",
    name: "Yassamin Ansari",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "04",
    name: "Greg Stanton",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "05",
    name: "Andy Biggs",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "06",
    name: "Juan Ciscomani",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "07",
    name: "Adelita Grijalva",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "08",
    name: "Abraham Hamadeh",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AZ",
    district: "09",
    name: "Paul Gosar",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AR",
    district: "01",
    name: "Eric Crawford",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AR",
    district: "02",
    name: "J. Hill",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AR",
    district: "03",
    name: "Steve Womack",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "AR",
    district: "04",
    name: "Bruce Westerman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "01",
    name: "James Gallagher",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "02",
    name: "Jared Huffman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "03",
    name: "Kevin Kiley",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "04",
    name: "Mike Thompson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "05",
    name: "Tom McClintock",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "06",
    name: "Ami Bera",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "07",
    name: "Doris Matsui",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "08",
    name: "John Garamendi",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "09",
    name: "Josh Harder",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "10",
    name: "Mark DeSaulnier",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "11",
    name: "Nancy Pelosi",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "12",
    name: "Lateefah Simon",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "13",
    name: "Adam Gray",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "14",
    name: "Aisha Wahab",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "15",
    name: "Kevin Mullin",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "16",
    name: "Sam Liccardo",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "17",
    name: "Ro Khanna",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "18",
    name: "Zoe Lofgren",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "19",
    name: "Jimmy Panetta",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "20",
    name: "Vince Fong",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "21",
    name: "Jim Costa",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "22",
    name: "David Valadao",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "23",
    name: "Jay Obernolte",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "24",
    name: "Salud Carbajal",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "25",
    name: "Raul Ruiz",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "26",
    name: "Julia Brownley",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "27",
    name: "George Whitesides",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "28",
    name: "Judy Chu",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "29",
    name: "Luz Rivas",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "30",
    name: "Laura Friedman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "31",
    name: "Gilbert Cisneros",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "32",
    name: "Brad Sherman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "33",
    name: "Pete Aguilar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "34",
    name: "Jimmy Gomez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "35",
    name: "Norma Torres",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "36",
    name: "Ted Lieu",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "37",
    name: "Sydney Kamlager-Dove",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "38",
    name: "Linda Sanchez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "39",
    name: "Mark Takano",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "40",
    name: "Young Kim",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "41",
    name: "Ken Calvert",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "42",
    name: "Robert Garcia",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "43",
    name: "Maxine Waters",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "44",
    name: "Nanette Barragan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "45",
    name: "Derek Tran",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "46",
    name: "J. Correa",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "47",
    name: "Dave Min",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "48",
    name: "Darrell Issa",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "49",
    name: "Mike Levin",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "50",
    name: "Scott Peters",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "51",
    name: "Sara Jacobs",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CA",
    district: "52",
    name: "Juan Vargas",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "01",
    name: "Diana DeGette",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "02",
    name: "Joe Neguse",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "03",
    name: "Jeff Hurd",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "04",
    name: "Lauren Boebert",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "05",
    name: "Jeff Crank",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "06",
    name: "Jason Crow",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "07",
    name: "Brittany Pettersen",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CO",
    district: "08",
    name: "Gabe Evans",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CT",
    district: "01",
    name: "John Larson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CT",
    district: "02",
    name: "Joe Courtney",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CT",
    district: "03",
    name: "Rosa DeLauro",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CT",
    district: "04",
    name: "James Himes",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "CT",
    district: "05",
    name: "Jahana Hayes",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "DE",
    district: "00",
    name: "Sarah McBride",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "01",
    name: "Jimmy Patronis",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "03",
    name: "Kat Cammack",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "04",
    name: "Aaron Bean",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "05",
    name: "John Rutherford",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "06",
    name: "Randy Fine",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "07",
    name: "Cory Mills",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "08",
    name: "Mike Haridopolos",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "09",
    name: "Darren Soto",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "10",
    name: "Maxwell Frost",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "11",
    name: "Daniel Webster",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "12",
    name: "Gus Bilirakis",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "13",
    name: "Anna Paulina Luna",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "14",
    name: "Kathy Castor",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "15",
    name: "Laurel Lee",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "16",
    name: "Vern Buchanan",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "17",
    name: "W. Steube",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "18",
    name: "Scott Franklin",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "19",
    name: "Byron Donalds",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "21",
    name: "Brian Mast",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "22",
    name: "Lois Frankel",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "23",
    name: "Jared Moskowitz",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "24",
    name: "Frederica Wilson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "25",
    name: "Debbie Wasserman Schultz",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "26",
    name: "Mario Diaz-Balart",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "27",
    name: "Maria Salazar",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "FL",
    district: "28",
    name: "Carlos Gimenez",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "01",
    name: "Earl Carter",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "02",
    name: "Sanford Bishop",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "03",
    name: "Brian Jack",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "04",
    name: "Henry Johnson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "05",
    name: "Nikema Williams",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "06",
    name: "Lucy McBath",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "07",
    name: "Richard McCormick",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "08",
    name: "Austin Scott",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "09",
    name: "Andrew Clyde",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "10",
    name: "Mike Collins",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "11",
    name: "Barry Loudermilk",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "12",
    name: "Rick Allen",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "13",
    name: "Everton Blair",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "GA",
    district: "14",
    name: "Clay Fuller",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "HI",
    district: "01",
    name: "Ed Case",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "HI",
    district: "02",
    name: "Jill Tokuda",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "ID",
    district: "01",
    name: "Russ Fulcher",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "ID",
    district: "02",
    name: "Michael Simpson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "01",
    name: "Jonathan Jackson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "02",
    name: "Robin Kelly",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "03",
    name: "Delia Ramirez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "04",
    name: "Jesus Garcia",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "05",
    name: "Mike Quigley",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "06",
    name: "Sean Casten",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "07",
    name: "Danny Davis",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "08",
    name: "Raja Krishnamoorthi",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "09",
    name: "Janice Schakowsky",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "10",
    name: "Bradley Schneider",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "11",
    name: "Bill Foster",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "12",
    name: "Mike Bost",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "13",
    name: "Nikki Budzinski",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "14",
    name: "Lauren Underwood",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "15",
    name: "Mary Miller",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "16",
    name: "Darin LaHood",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IL",
    district: "17",
    name: "Eric Sorensen",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "01",
    name: "Frank Mrvan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "02",
    name: "Rudy Yakym",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "03",
    name: "Marlin Stutzman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "04",
    name: "James Baird",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "05",
    name: "Victoria Spartz",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "06",
    name: "Jefferson Shreve",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "07",
    name: "Andre Carson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "08",
    name: "Mark Messmer",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IN",
    district: "09",
    name: "Erin Houchin",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IA",
    district: "01",
    name: "Mariannette Miller-Meeks",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IA",
    district: "02",
    name: "Ashley Hinson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IA",
    district: "03",
    name: "Zachary Nunn",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "IA",
    district: "04",
    name: "Randy Feenstra",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KS",
    district: "01",
    name: "Tracey Mann",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KS",
    district: "02",
    name: "Derek Schmidt",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KS",
    district: "03",
    name: "Sharice Davids",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KS",
    district: "04",
    name: "Ron Estes",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "01",
    name: "James Comer",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "02",
    name: "Brett Guthrie",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "03",
    name: "Morgan McGarvey",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "04",
    name: "Thomas Massie",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "05",
    name: "Harold Rogers",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "KY",
    district: "06",
    name: "Andy Barr",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "01",
    name: "Steve Scalise",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "02",
    name: "Troy Carter",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "03",
    name: "Clay Higgins",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "04",
    name: "Mike Johnson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "05",
    name: "Julia Letlow",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "LA",
    district: "06",
    name: "Cleo Fields",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "ME",
    district: "01",
    name: "Chellie Pingree",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "ME",
    district: "02",
    name: "Jared Golden",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "01",
    name: "Andy Harris",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "02",
    name: "Johnny Olszewski",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "03",
    name: "Sarah Elfreth",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "04",
    name: "Glenn Ivey",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "05",
    name: "Steny Hoyer",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "06",
    name: "April McClain Delaney",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "07",
    name: "Kweisi Mfume",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MD",
    district: "08",
    name: "Jamie Raskin",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "01",
    name: "Richard Neal",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "02",
    name: "James McGovern",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "03",
    name: "Lori Trahan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "04",
    name: "Jake Auchincloss",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "05",
    name: "Katherine Clark",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "06",
    name: "Seth Moulton",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "07",
    name: "Ayanna Pressley",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "08",
    name: "Stephen Lynch",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MA",
    district: "09",
    name: "William Keating",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "01",
    name: "Jack Bergman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "02",
    name: "John Moolenaar",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "03",
    name: "Hillary Scholten",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "04",
    name: "Bill Huizenga",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "05",
    name: "Tim Walberg",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "06",
    name: "Debbie Dingell",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "07",
    name: "Tom Barrett",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "08",
    name: "Kristen McDonald Rivet",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "09",
    name: "Lisa McClain",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "10",
    name: "John James",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "11",
    name: "Haley Stevens",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "12",
    name: "Rashida Tlaib",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MI",
    district: "13",
    name: "Shri Thanedar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "01",
    name: "Brad Finstad",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "02",
    name: "Angie Craig",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "03",
    name: "Kelly Morrison",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "04",
    name: "Betty McCollum",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "05",
    name: "Ilhan Omar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "06",
    name: "Tom Emmer",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "07",
    name: "Michelle Fischbach",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MN",
    district: "08",
    name: "Pete Stauber",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MS",
    district: "01",
    name: "Trent Kelly",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MS",
    district: "02",
    name: "Bennie Thompson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MS",
    district: "03",
    name: "Michael Guest",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MS",
    district: "04",
    name: "Mike Ezell",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "01",
    name: "Wesley Bell",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "02",
    name: "Ann Wagner",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "03",
    name: "Robert Onder",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "04",
    name: "Mark Alford",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "05",
    name: "Emanuel Cleaver",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "06",
    name: "Sam Graves",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "07",
    name: "Eric Burlison",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MO",
    district: "08",
    name: "Jason Smith",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MT",
    district: "01",
    name: "Ryan Zinke",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "MT",
    district: "02",
    name: "Troy Downing",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NE",
    district: "01",
    name: "Mike Flood",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NE",
    district: "02",
    name: "Don Bacon",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NE",
    district: "03",
    name: "Adrian Smith",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NV",
    district: "01",
    name: "Dina Titus",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NV",
    district: "02",
    name: "Mark Amodei",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NV",
    district: "03",
    name: "Susie Lee",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NV",
    district: "04",
    name: "Steven Horsford",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NH",
    district: "01",
    name: "Chris Pappas",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NH",
    district: "02",
    name: "Maggie Goodlander",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "01",
    name: "Donald Norcross",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "02",
    name: "Jefferson Van Drew",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "03",
    name: "Herbert Conaway",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "04",
    name: "Christopher Smith",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "05",
    name: "Josh Gottheimer",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "06",
    name: "Frank Pallone",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "07",
    name: "Thomas Kean",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "08",
    name: "Robert Menendez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "09",
    name: "Nellie Pou",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "10",
    name: "LaMonica McIver",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "11",
    name: "Analilia Mejia",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NJ",
    district: "12",
    name: "Bonnie Watson Coleman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NM",
    district: "01",
    name: "Melanie Stansbury",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NM",
    district: "02",
    name: "Gabe Vasquez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NM",
    district: "03",
    name: "Teresa Leger Fernandez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "01",
    name: "Nick LaLota",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "02",
    name: "Andrew Garbarino",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "03",
    name: "Thomas Suozzi",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "04",
    name: "Laura Gillen",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "05",
    name: "Gregory Meeks",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "06",
    name: "Grace Meng",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "07",
    name: "Nydia Velazquez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "08",
    name: "Hakeem Jeffries",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "09",
    name: "Yvette Clarke",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "10",
    name: "Daniel Goldman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "11",
    name: "Nicole Malliotakis",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "12",
    name: "Jerrold Nadler",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "13",
    name: "Adriano Espaillat",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "14",
    name: "Alexandria Ocasio-Cortez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "15",
    name: "Ritchie Torres",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "16",
    name: "George Latimer",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "17",
    name: "Michael Lawler",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "18",
    name: "Patrick Ryan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "19",
    name: "Josh Riley",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "20",
    name: "Paul Tonko",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "21",
    name: "Elise Stefanik",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "22",
    name: "John Mannion",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "23",
    name: "Nicholas Langworthy",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "24",
    name: "Claudia Tenney",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "25",
    name: "Joseph Morelle",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NY",
    district: "26",
    name: "Timothy Kennedy",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "01",
    name: "Donald Davis",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "02",
    name: "Deborah Ross",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "03",
    name: "Gregory Murphy",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "04",
    name: "Valerie Foushee",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "05",
    name: "Virginia Foxx",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "06",
    name: "Addison McDowell",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "07",
    name: "David Rouzer",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "08",
    name: "Mark Harris",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "09",
    name: "Richard Hudson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "10",
    name: "Pat Harrigan",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "11",
    name: "Chuck Edwards",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "12",
    name: "Alma Adams",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "13",
    name: "Brad Knott",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "NC",
    district: "14",
    name: "Tim Moore",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "ND",
    district: "00",
    name: "Julie Fedorchak",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "01",
    name: "Greg Landsman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "02",
    name: "David Taylor",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "03",
    name: "Joyce Beatty",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "04",
    name: "Jim Jordan",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "05",
    name: "Robert Latta",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "06",
    name: "Michael Rulli",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "07",
    name: "Max Miller",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "08",
    name: "Warren Davidson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "09",
    name: "Marcy Kaptur",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "10",
    name: "Michael Turner",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "11",
    name: "Shontel Brown",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "12",
    name: "Troy Balderson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "13",
    name: "Emilia Sykes",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "14",
    name: "David Joyce",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OH",
    district: "15",
    name: "Mike Carey",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OK",
    district: "01",
    name: "Kevin Hern",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OK",
    district: "02",
    name: "Josh Brecheen",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OK",
    district: "03",
    name: "Frank Lucas",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OK",
    district: "04",
    name: "Tom Cole",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OK",
    district: "05",
    name: "Stephanie Bice",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "01",
    name: "Suzanne Bonamici",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "02",
    name: "Cliff Bentz",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "03",
    name: "Maxine Dexter",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "04",
    name: "Val Hoyle",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "05",
    name: "Janelle Bynum",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "OR",
    district: "06",
    name: "Andrea Salinas",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "01",
    name: "Brian Fitzpatrick",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "02",
    name: "Brendan Boyle",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "03",
    name: "Dwight Evans",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "04",
    name: "Madeleine Dean",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "05",
    name: "Mary Gay Scanlon",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "06",
    name: "Chrissy Houlahan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "07",
    name: "Ryan Mackenzie",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "08",
    name: "Robert Bresnahan",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "09",
    name: "Daniel Meuser",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "10",
    name: "Scott Perry",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "11",
    name: "Lloyd Smucker",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "12",
    name: "Summer Lee",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "13",
    name: "John Joyce",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "14",
    name: "Guy Reschenthaler",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "15",
    name: "Glenn Thompson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "16",
    name: "Mike Kelly",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "PA",
    district: "17",
    name: "Christopher Deluzio",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "RI",
    district: "01",
    name: "Gabe Amo",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "RI",
    district: "02",
    name: "Seth Magaziner",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "01",
    name: "Nancy Mace",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "02",
    name: "Joe Wilson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "03",
    name: "Sheri Biggs",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "04",
    name: "William Timmons",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "05",
    name: "Ralph Norman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "06",
    name: "James Clyburn",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SC",
    district: "07",
    name: "Russell Fry",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "SD",
    district: "00",
    name: "Dusty Johnson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "01",
    name: "Diana Harshbarger",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "02",
    name: "Tim Burchett",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "03",
    name: "Charles Fleischmann",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "04",
    name: "Scott DesJarlais",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "05",
    name: "Andrew Ogles",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "06",
    name: "John Rose",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "07",
    name: "Matt Van Epps",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "08",
    name: "David Kustoff",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TN",
    district: "09",
    name: "Steve Cohen",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "01",
    name: "Nathaniel Moran",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "02",
    name: "Dan Crenshaw",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "03",
    name: "Keith Self",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "04",
    name: "Pat Fallon",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "05",
    name: "Lance Gooden",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "06",
    name: "Jake Ellzey",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "07",
    name: "Lizzie Fletcher",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "08",
    name: "Morgan Luttrell",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "09",
    name: "Al Green",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "10",
    name: "Michael McCaul",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "11",
    name: "August Pfluger",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "12",
    name: "Craig Goldman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "13",
    name: "Ronny Jackson",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "14",
    name: "Randy Weber",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "15",
    name: "Monica De La Cruz",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "16",
    name: "Veronica Escobar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "17",
    name: "Pete Sessions",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "18",
    name: "Christian Menefee",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "19",
    name: "Jodey Arrington",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "20",
    name: "Joaquin Castro",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "21",
    name: "Chip Roy",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "22",
    name: "Troy Nehls",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "24",
    name: "Beth Van Duyne",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "25",
    name: "Roger Williams",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "26",
    name: "Brandon Gill",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "27",
    name: "Michael Cloud",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "28",
    name: "Henry Cuellar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "29",
    name: "Sylvia Garcia",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "30",
    name: "Jasmine Crockett",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "31",
    name: "John Carter",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "32",
    name: "Julie Johnson",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "33",
    name: "Marc Veasey",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "34",
    name: "Vicente Gonzalez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "35",
    name: "Greg Casar",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "36",
    name: "Brian Babin",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "37",
    name: "Lloyd Doggett",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "TX",
    district: "38",
    name: "Wesley Hunt",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "UT",
    district: "01",
    name: "Blake Moore",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "UT",
    district: "02",
    name: "Celeste Maloy",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "UT",
    district: "03",
    name: "Mike Kennedy",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "UT",
    district: "04",
    name: "Burgess Owens",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VT",
    district: "00",
    name: "Becca Balint",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "01",
    name: "Rob Wittman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "02",
    name: "Jen Kiggans",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "03",
    name: "Bobby Scott",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "04",
    name: "Jennifer McClellan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "05",
    name: "John McGuire",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "06",
    name: "Ben Cline",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "07",
    name: "Eugene Vindman",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "08",
    name: "Don Beyer",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "09",
    name: "Morgan Griffith",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "10",
    name: "Suhas Subramanyam",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "VA",
    district: "11",
    name: "James Walkinshaw",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "01",
    name: "Suzan DelBene",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "02",
    name: "Rick Larsen",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "03",
    name: "Marie Gluesenkamp Perez",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "04",
    name: "Dan Newhouse",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "05",
    name: "Michael Baumgartner",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "06",
    name: "Emily Randall",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "07",
    name: "Pramila Jayapal",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "08",
    name: "Kim Schrier",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "09",
    name: "Adam Smith",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WA",
    district: "10",
    name: "Marilyn Strickland",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WV",
    district: "01",
    name: "Carol Miller",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WV",
    district: "02",
    name: "Riley Moore",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "01",
    name: "Bryan Steil",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "02",
    name: "Mark Pocan",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "03",
    name: "Derrick Van Orden",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "04",
    name: "Gwen Moore",
    party: "D",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "05",
    name: "Scott Fitzgerald",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "06",
    name: "Glenn Grothman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "07",
    name: "Tom Tiffany",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WI",
    district: "08",
    name: "Tony Wied",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
  {
    chamber: "house",
    state: "WY",
    district: "00",
    name: "Harriet Hageman",
    party: "R",
    website: "https://www.house.gov/representatives/find-your-representative", // see header note
    phone: "202-224-3121", // Capitol switchboard — see header note
  },
];

export const OFFICIAL_HOUSE_LOOKUP_URL = "https://www.house.gov/representatives/find-your-representative";
export const OFFICIAL_SENATE_LOOKUP_URL = "https://www.senate.gov/senators/senators-contact.htm";

export function findRepresentatives(state: string, district: string): RepresentativeEntry[] {
  return REPRESENTATIVES.filter(
    (r) => r.state === state && (r.chamber === "senate" || r.district === district)
  );
}

/** True if this dataset has any coverage at all for the given state (regardless of district). */
export function hasStateCoverage(state: string): boolean {
  return REPRESENTATIVES.some((r) => r.state === state);
}
