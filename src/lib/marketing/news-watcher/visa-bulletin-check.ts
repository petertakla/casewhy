// Round 90 — "detects a new month, flags the KB refresh" per the task
// doc's own scope (Visa Bulletin itself isn't scraped: travel.state.gov
// sits behind a Cloudflare challenge that blocks a plain fetch, confirmed
// in kb/visa-bulletin.ts's own comment — this file's hand-captured-
// snapshot approach is deliberate, not a gap). A pure date comparison
// against the constant already in that file, no network call at all.

import { VISA_BULLETIN_MONTH } from "../../kb/visa-bulletin";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function currentBulletinMonthLabel(now = new Date()): string {
  return `${MONTH_NAMES[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

/** Returns a stable destination id for the current month if the hand-captured KB is stale, or null if it's current. */
export function staleVisaBulletinDestination(now = new Date()): string | null {
  const current = currentBulletinMonthLabel(now);
  if (current === VISA_BULLETIN_MONTH) return null;
  return `visa-bulletin-refresh-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
