// Round 110 — detects a US state mentioned in a free-text search query
// ("attorney florida", "legal aid tx", "abogado en nueva york"), English
// or Spanish, full name or abbreviation, per the task doc's Section 6
// requirement. Most state names transliterate unchanged into Spanish
// (Texas, Florida, California); only the handful with a real, commonly-
// used Spanish name get a second entry below -- not machine-translating
// the other 44, since "Ohio" isn't rendered any differently in Spanish
// and a fabricated translation would just be noise.

const STATE_NAMES: Record<string, string[]> = {
  AL: ["alabama"],
  AK: ["alaska"],
  AZ: ["arizona"],
  AR: ["arkansas"],
  CA: ["california"],
  CO: ["colorado"],
  CT: ["connecticut"],
  DE: ["delaware"],
  DC: ["district of columbia", "washington dc", "distrito de columbia"],
  FL: ["florida"],
  GA: ["georgia"],
  HI: ["hawaii"],
  ID: ["idaho"],
  IL: ["illinois"],
  IN: ["indiana"],
  IA: ["iowa"],
  KS: ["kansas"],
  KY: ["kentucky"],
  LA: ["louisiana"],
  ME: ["maine"],
  MD: ["maryland"],
  MA: ["massachusetts"],
  MI: ["michigan"],
  MN: ["minnesota"],
  MS: ["mississippi"],
  MO: ["missouri"],
  MT: ["montana"],
  NE: ["nebraska"],
  NV: ["nevada"],
  NH: ["new hampshire", "nuevo hampshire"],
  NJ: ["new jersey", "nueva jersey"],
  NM: ["new mexico", "nuevo mexico", "nuevo méxico"],
  NY: ["new york", "nueva york"],
  NC: ["north carolina", "carolina del norte"],
  ND: ["north dakota", "dakota del norte"],
  OH: ["ohio"],
  OK: ["oklahoma"],
  OR: ["oregon"],
  PA: ["pennsylvania"],
  RI: ["rhode island"],
  SC: ["south carolina", "carolina del sur"],
  SD: ["south dakota", "dakota del sur"],
  TN: ["tennessee"],
  TX: ["texas"],
  UT: ["utah"],
  VT: ["vermont"],
  VA: ["virginia"],
  WA: ["washington"],
  WV: ["west virginia", "virginia occidental"],
  WI: ["wisconsin"],
  WY: ["wyoming"],
};

const ABBREVIATIONS = new Set(Object.keys(STATE_NAMES));

/** Returns a two-letter state code if the query mentions one (name or abbreviation, English or Spanish), else null. */
export function detectState(query: string): string | null {
  const words = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  // A bare two-letter token that's a real state code, e.g. "legal aid tx".
  for (const w of words) {
    if (w.length === 2 && ABBREVIATIONS.has(w.toUpperCase())) return w.toUpperCase();
  }

  const normalizedQuery = words.join(" ");

  // Check longer names first -- "virginia occidental" (WV) contains
  // "virginia" (VA) as a substring, so a short-name-first scan would
  // return the wrong state for West Virginia, North/South Carolina,
  // North/South Dakota, and any other "X <state>" compound name.
  const allNames = Object.entries(STATE_NAMES).flatMap(([code, names]) => names.map((name) => ({ code, name })));
  allNames.sort((a, b) => b.name.length - a.name.length);

  for (const { code, name } of allNames) {
    const normalizedName = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (normalizedQuery.includes(normalizedName)) return code;
  }
  return null;
}
