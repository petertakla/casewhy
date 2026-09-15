"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Round 101 — extracted from AuthHeader.tsx's own inline computation
// (rounds 79-83's follow-ups) so SiteFooter can use the exact same logic
// instead of its own one-time cookie read (AdminShellClient.tsx's
// useIsSpanish did that, and round 98 hit a real race because of it: a
// child component's one-time read could capture a stale value a beat
// before the parent's own effect cleared the cookie). Moved verbatim,
// not rewritten — every comment below is round 83's original reasoning,
// kept so the semantics can't drift by accident.

const LOCALE_COOKIE = "casewhy_locale";

// Round 83 — replaces the original narrower TRANSLATED_EN_PATHS allowlist
// (just /plus, /get-help, and the six round-79 entity-list pages). That
// list only cleared the cookie on pages known to have a real /es/*
// counterpart, leaving it untouched everywhere else — including plain
// English-only pages with no locale awareness at all (/, /faq, /policy,
// entity detail pages like /attorneys/[id], etc.). A visitor who'd set
// the cookie earlier and later landed on one of those saw the header
// (and its Sign in link, still built off the stale cookie) silently stay
// in Spanish while the page body was English — reported directly: "click
// sign in and it flips the language." The round-80 family below is the
// opposite case and has to stay excluded: those pages ARE locale-aware
// (read the same cookie/query-param signal server-side via
// isSpanishLocale()), so arriving with no explicit `?lang=` shouldn't
// reset anything — the whole point of the cookie is to survive exactly
// that kind of ordinary, param-less navigation.
// Round 105 — /policy, /updates, and /get-help/ask join the round-82
// same-route family (?lang=es on the same URL, no separate /es/* twin),
// same reasoning as /news above.
const LOCALE_AWARE_EN_PATHS = [
  "/dashboard",
  "/ask",
  "/settings",
  "/processing-times",
  "/visa-bulletin",
  "/news",
  "/policy",
  "/updates",
  "/get-help/ask",
];

// Round 83 follow-up — the six entity-type detail pages (/attorneys/[id],
// /legal-aid/[slug], etc.) became locale-aware too, reading the same
// cookie/query-param signal. Prefix-matched rather than added to the exact
// list above since the slug varies per listing — but each entity type's
// /join application-form sub-route is deliberately excluded: that page has
// no Spanish version at all, so it should still reset to English like any
// other English-only page.
const LOCALE_AWARE_EN_PREFIXES = [
  // Round 98 — the admin shell has no /es/admin route (out of that
  // round's scope), but its own chrome (sidebar, breadcrumb, this
  // header's own "Admin" link) does honor the sticky preference, per
  // that round's "Spanish labels render throughout the shell" ask.
  // Without this, landing on /admin cleared the cookie via the
  // non-locale-aware-path branch below before AdminShellClient's own
  // one-time cookie read even ran -- caught live: header stayed English
  // while the shell's sidebar showed Spanish, disagreeing with itself.
  "/admin",
  "/attorneys/",
  "/legal-aid/",
  "/dso/",
  "/community-orgs/",
  "/pro-bono-representation/",
  "/accredited-representatives/",
  // Round 105 — /policy/[id] and /updates/[slug], the dynamic half of the
  // same-route family added to LOCALE_AWARE_EN_PATHS above. No /join
  // sub-route exists under either, so the shared `!endsWith("/join")`
  // exclusion below is a no-op here, not a real carve-out.
  "/policy/",
  "/updates/",
];

function isLocaleAwarePath(pathname: string): boolean {
  if (pathname === "/es" || pathname.startsWith("/es/") || pathname.startsWith("/auth/") || LOCALE_AWARE_EN_PATHS.includes(pathname)) {
    return true;
  }
  return LOCALE_AWARE_EN_PREFIXES.some((prefix) => pathname.startsWith(prefix) && !pathname.endsWith("/join"));
}

export function useIsSpanish(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Round 79 follow-up — this header renders on every page via the root
  // layout, including the /es/* pages round 79 added, but it was never made
  // locale-aware: it always showed English labels and always linked back to
  // the English /get-help and /plus, silently bouncing a Spanish-page
  // visitor out of Spanish the moment they touched the header. Only /plus
  // and /get-help have Spanish counterparts (Dashboard, Ask, Settings,
  // Processing times, Visa bulletin, News, and the sign-in form itself
  // don't) — so those are the only destinations that switch here.
  const onEsPath = pathname === "/es" || pathname.startsWith("/es/");

  // Second follow-up, same day — Peter caught that signing in from an /es/*
  // page still dropped the visitor back to English: /auth/sign-in redirects
  // to /dashboard, which has no Spanish version, so path-only detection
  // above goes false the instant they land there. A short-lived cookie
  // carries the preference across that jump. It's only ever read after
  // mount (see the `mounted` guard) so the server-rendered HTML — which has
  // no way to know the cookie's value without wiring cookies() through the
  // root layout — always matches the client's first paint; the label/href
  // upgrade to Spanish happens a beat later as a normal state update, not a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [localeCookie, setLocaleCookie] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const match = document.cookie.match(/(?:^|; )casewhy_locale=([^;]*)/);
    setLocaleCookie(match ? decodeURIComponent(match[1]) : null);
  }, []);

  // Third follow-up, same day — the cookie alone wasn't reliably surviving
  // the real sign-in form submission (Peter reproduced it with actual
  // credentials; a synthetic click-through couldn't). Rather than keep
  // chasing an unconfirmed timing theory, `?lang=es` is now threaded
  // explicitly through the one hop that matters — /auth/sign-in's redirect
  // to /dashboard (see sign-in/page.tsx) — so that specific hop no longer
  // depends on a cookie write having landed in time at all. This still
  // treats it as onEsPath-equivalent and re-arms the cookie for whatever
  // navigation happens next.
  const langParamEs = searchParams.get("lang") === "es";
  // Round 82 — the page-level language switcher on in-place-localized pages
  // sends an explicit `?lang=en` to flip back from a sticky Spanish cookie;
  // without this branch the cookie would just re-assert Spanish on the very
  // next ordinary nav click, making the switcher's English link a no-op.
  const langParamEn = searchParams.get("lang") === "en";

  useEffect(() => {
    if (!mounted) return;
    if (onEsPath || langParamEs) {
      document.cookie = `${LOCALE_COOKIE}=es; path=/; max-age=2592000`; // 30 days
      setLocaleCookie("es");
    } else if (langParamEn || !isLocaleAwarePath(pathname)) {
      document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
      setLocaleCookie(null);
    }
  }, [pathname, mounted, onEsPath, langParamEs, langParamEn]);

  return !langParamEn && (onEsPath || langParamEs || (mounted && localeCookie === "es"));
}
