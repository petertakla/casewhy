import { cookies } from "next/headers";

// Round 80 — reads the same signal AuthHeader.tsx already established
// (round 79's follow-ups): a `?lang=es` query param carried through a
// specific navigation (e.g. the sign-in redirect), falling back to the
// sticky `casewhy_locale` cookie for ordinary navigation. Only ever called
// from pages already `force-dynamic` (session-dependent), so reading
// cookies() here doesn't newly taint anything that was previously static.
export async function isSpanishLocale(langParam?: string): Promise<boolean> {
  if (langParam === "es") return true;
  const store = await cookies();
  return store.get("casewhy_locale")?.value === "es";
}
