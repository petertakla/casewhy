// CW-39 — resolves a mailing address to its congressional district via
// the Census Bureau's free Geocoding Services API. Real, verified endpoint
// and response shape (tested directly, Sep 6 2026, against real addresses
// — e.g. Tallahassee, FL correctly resolved to FL-02): layer 54 is the
// "119th Congressional Districts" TIGERweb layer; layer 10 (sometimes
// assumed from older docs) returns Census Block Groups instead.

const CENSUS_GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/geographies/address";

// Standard, stable FIPS state-code -> USPS postal abbreviation mapping.
// Unlike congressional membership (which changes constantly), this table
// itself essentially never changes — safe to hand-maintain in full.
const STATE_FIPS_TO_POSTAL: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY", "60": "AS", "66": "GU", "69": "MP",
  "72": "PR", "78": "VI",
};

export interface MailingAddressInput {
  street: string;
  city: string;
  state: string;
  zip?: string;
}

export interface DistrictResult {
  /** USPS postal abbreviation, e.g. "FL". */
  state: string;
  /** Two-digit district number as returned by Census, e.g. "02", or "00"/"98" for at-large/delegate districts. */
  district: string;
  matchedAddress: string;
}

/** Thrown when the Census API itself fails (network, 5xx) — distinct from "no match found," which returns null. */
export class GeocoderError extends Error {}

export async function resolveCongressionalDistrict(
  input: MailingAddressInput
): Promise<DistrictResult | null> {
  const params = new URLSearchParams({
    street: input.street,
    city: input.city,
    state: input.state,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "54",
    format: "json",
  });
  if (input.zip) params.set("zip", input.zip);

  let res: Response;
  try {
    res = await fetch(`${CENSUS_GEOCODER_URL}?${params}`);
  } catch (err) {
    throw new GeocoderError(`Census geocoder request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    throw new GeocoderError(`Census geocoder returned ${res.status}`);
  }

  const data = await res.json();
  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;

  const cd = match.geographies?.["119th Congressional Districts"]?.[0];
  if (!cd) return null;

  const statePostal = STATE_FIPS_TO_POSTAL[cd.STATE];
  if (!statePostal) return null;

  return {
    state: statePostal,
    district: cd.CD119,
    matchedAddress: match.matchedAddress,
  };
}
