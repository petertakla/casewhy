// Round 122 follow-up — shared shape for the CIGP live-refresh pipeline,
// matching scripts/seed-community-orgs.ts's own SeedRecord field-for-field.

export interface CigpRecord {
  organizationName: string;
  cityStateZip: string;
  state: string;
  description: string | null;
  fiscalYearsAwarded: string;
  sourceCitation: string;
}

export const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};
