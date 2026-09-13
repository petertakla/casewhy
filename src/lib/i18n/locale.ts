import { cookies } from "next/headers";

// Round 80 — reads the same signal AuthHeader.tsx already established
// (round 79's follow-ups): a `?lang=es` query param carried through a
// specific navigation (e.g. the sign-in redirect), falling back to the
// sticky `casewhy_locale` cookie for ordinary navigation. Only ever called
// from pages already `force-dynamic` (session-dependent), so reading
// cookies() here doesn't newly taint anything that was previously static.
//
// Round 82 — `?lang=en` is now an explicit override too, not just `es`.
// Without this, a Spanish-cookied visitor had no way to get back to English
// on any in-place-localized page (the cookie always won) — this is what
// makes the page-level language switcher below actually work in both
// directions, matching round 79's forked /es/* pages, which always had one.
export async function isSpanishLocale(langParam?: string): Promise<boolean> {
  if (langParam === "es") return true;
  if (langParam === "en") return false;
  const store = await cookies();
  return store.get("casewhy_locale")?.value === "es";
}
