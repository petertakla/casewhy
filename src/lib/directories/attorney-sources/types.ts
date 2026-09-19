// Round 117 monthly-automation follow-up — shared shape for every state-bar
// attorney source fetcher (texas.ts/florida.ts/north-carolina.ts/california.ts),
// matching scripts/seed-attorneys.ts's own SeedRecord field-for-field so the
// cron route can insert these directly with no translation layer.

export interface AttorneySourceRecord {
  name: string;
  firm: string | null;
  state: string;
  barNumber: string | null;
  practiceFocus: string;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  streetAddress: string | null;
  cityStateZip: string | null;
  sourceCitation: string;
}

export const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/** Runs `fn` over `items` with at most `limit` in flight at once — a plain
 * concurrency cap, not a queue library, since every one of these sources is
 * a few hundred detail-page fetches at most (not worth a dependency). */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Standard Cloudflare "email protection" decode (data-cfemail hex string,
 * XOR'd against its own first byte) -- a public, documented obfuscation
 * scheme (not a proprietary anti-scraping token, unlike Texas's -- see
 * texas.ts), used by Florida Bar's directory pages. */
export function decodeCloudflareEmail(encoded: string): string {
  const key = parseInt(encoded.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < encoded.length; i += 2) {
    out += String.fromCharCode(parseInt(encoded.slice(i, i + 2), 16) ^ key);
  }
  return out;
}
