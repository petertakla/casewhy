"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", labelEs: "Panel" },
  { href: "/ask", label: "Ask a question", labelEs: "Hacer una pregunta" },
  { href: "/plus", label: "CaseWhy Plus" },
  { href: "/get-help", label: "Get Help", labelEs: "Obtener ayuda" },
  { href: "/processing-times", label: "Processing times", labelEs: "Tiempos de procesamiento" },
  { href: "/visa-bulletin", label: "Visa bulletin", labelEs: "Boletín de visas" },
  { href: "/news", label: "News", labelEs: "Noticias" },
  { href: "/settings", label: "Settings", labelEs: "Configuración" },
];

// Round 98 — appended separately (not just pushed into NAV_LINKS above)
// because it's the one nav entry gated on more than "signed in": it only
// renders for admin@casewhy.com, checked via /api/admin/is-admin since
// ADMIN_EMAIL itself can never ship to this client component's bundle.
const ADMIN_LINK = { href: "/admin", label: "Admin", labelEs: "Administración" };

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
const LOCALE_AWARE_EN_PATHS = ["/dashboard", "/ask", "/settings", "/processing-times", "/visa-bulletin", "/news"];

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
];

function isLocaleAwarePath(pathname: string): boolean {
  if (pathname === "/es" || pathname.startsWith("/es/") || pathname.startsWith("/auth/") || LOCALE_AWARE_EN_PATHS.includes(pathname)) {
    return true;
  }
  return LOCALE_AWARE_EN_PREFIXES.some((prefix) => pathname.startsWith(prefix) && !pathname.endsWith("/join"));
}

const LOCALE_COOKIE = "casewhy_locale";

function AuthHeaderInner() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Gated on session, not path — several public marketing pages (e.g. /plus,
  // /news) are also NAV_LINKS entries, and a signed-out visitor landing on
  // one of those must never see the signed-in-only links (Dashboard,
  // Settings, etc.), regardless of which page they're on.
  const isSignedIn = !isPending && !!session?.user;

  // Round 98 — one fetch per sign-in, not polled: this is a single-admin
  // internal tool, not a multi-user product where the badge/visibility
  // needs to stay live-fresh across a long-open tab. The pending-count
  // badge itself lives only inside the admin shell (AdminShellClient),
  // not here -- computing it would mean every signed-in page load, for
  // every visitor, doing an extra DB round-trip just to decide whether a
  // number badge shows on a link 99% of visitors can't even see.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/admin/is-admin")
      .then((r) => r.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [isSignedIn]);

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

  const isSpanish = !langParamEn && (onEsPath || langParamEs || (mounted && localeCookie === "es"));
  const ES_HREF: Record<string, string> = {
    "/get-help": "/es/get-help",
    "/plus": "/es/plus",
  };
  function localizeHref(href: string) {
    return isSpanish ? (ES_HREF[href] ?? href) : href;
  }

  // Round 71, item 7 — a fade-mask affordance at the scrollable edges,
  // shown only on the side there's actually more nav to reveal (never a
  // static decoration that's wrong once the user scrolls to the true end).
  const navScrollRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 1);
      // -1 tolerance for sub-pixel rounding at the true end.
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 text-sm">
        <Link href={isSpanish ? "/?lang=es" : "/"}>
          <Logo />
        </Link>

        {isSignedIn && (
          <div className="relative order-3 w-full sm:order-none sm:w-auto">
            <nav
              ref={navScrollRef}
              className="flex gap-x-5 gap-y-1 overflow-x-auto text-sm"
            >
              {(isAdmin ? [...NAV_LINKS, ADMIN_LINK] : NAV_LINKS).map((link) => {
                const href = localizeHref(link.href);
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={link.href}
                    href={href}
                    className={`whitespace-nowrap pb-0.5 ${
                      active
                        ? "border-b-2 border-brand-500 font-semibold text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {isSpanish && link.labelEs ? link.labelEs : link.label}
                  </Link>
                );
              })}
            </nav>
            {/* Fade masks — pointer-events-none so they never block clicks
                on the nav links underneath. Static gradients, not animated,
                so prefers-reduced-motion only needs to disable the opacity
                transition, not the affordance itself. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface/80 to-transparent backdrop-blur-md transition-opacity motion-reduce:transition-none ${
                canScrollLeft ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface/80 to-transparent backdrop-blur-md transition-opacity motion-reduce:transition-none ${
                canScrollRight ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        )}

        {isPending ? null : session?.user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-muted">{session.user.email}</span>
            <button
              type="button"
              onClick={() =>
                authClient.signOut().then(() => {
                  // Explicit redirect, not just router.refresh() — refresh()
                  // alone re-fetches the *current* route's server data, which
                  // leaves the user sitting on a protected page (e.g.
                  // /dashboard) that may not gracefully handle a suddenly-
                  // missing session. Redirecting to "/" first guarantees a
                  // sane landing spot regardless of what page sign-out was
                  // clicked from; refresh() after ensures a fresh fetch even
                  // if already on "/".
                  router.push("/");
                  router.refresh();
                })
              }
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isSpanish ? "Cerrar sesión" : "Sign out"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href={localizeHref("/get-help")} className="text-muted hover:text-foreground">
              {isSpanish ? "Obtener ayuda" : "Get Help"}
            </Link>
            <Link
              href={isSpanish ? "/auth/sign-in?lang=es" : "/auth/sign-in"}
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isSpanish ? "Iniciar sesión" : "Sign in"}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// useSearchParams() requires a Suspense boundary for any page that's part of
// static generation — and this header renders on every page via the root
// layout, including the app's statically-prerendered marketing/content
// pages, so the boundary has to live here rather than assume every caller
// already has one above it.
export function AuthHeader() {
  return (
    <Suspense fallback={null}>
      <AuthHeaderInner />
    </Suspense>
  );
}
