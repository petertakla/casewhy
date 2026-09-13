"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// The four auth pages are the one remaining part of the app that never
// fell back to the sticky `casewhy_locale` cookie — they're client
// components (real form state, useRouter), so they can't call
// isSpanishLocale() (next/headers, server-only) the way every other
// locale-aware page does. They only ever checked the explicit `?lang=es`
// query param, so a visitor with Spanish already selected elsewhere who
// reached /auth/sign-in any other way (typed URL, bookmark, a magic-link
// email, browser back/forward) landed in English with no visible reason
// why — reported directly by Peter. Mirrors AuthHeader.tsx's own
// mounted-guarded cookie read for the same hydration-safety reason: all
// four pages are statically prerendered, so there's no server-rendered
// HTML that could know the cookie's value without threading cookies()
// through, and the cookie-driven upgrade happens a beat after mount as a
// normal state update, not a hydration mismatch.
export function useIsSpanish(): boolean {
  const langParam = useSearchParams().get("lang");
  const [cookieEs, setCookieEs] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )casewhy_locale=([^;]*)/);
    setCookieEs(match ? decodeURIComponent(match[1]) === "es" : false);
  }, []);

  if (langParam === "es") return true;
  if (langParam === "en") return false;
  return cookieEs;
}
