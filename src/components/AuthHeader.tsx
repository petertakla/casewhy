"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ask", label: "Ask a question" },
  { href: "/plus", label: "CaseWhy Plus" },
  { href: "/get-help", label: "Get Help", labelEs: "Obtener ayuda" },
  { href: "/processing-times", label: "Processing times" },
  { href: "/visa-bulletin", label: "Visa bulletin" },
  { href: "/news", label: "News" },
  { href: "/settings", label: "Settings" },
];

// Every English page that has a real /es/* counterpart — landing on one of
// these exactly is treated as an explicit "back to English" signal (see
// LOCALE_COOKIE below). Everything else (Dashboard, Ask, Settings, News,
// Processing times, Visa bulletin, the auth pages) has no Spanish version
// at all, so visiting one of those doesn't say anything about intent either
// way — the sticky preference is left alone.
const TRANSLATED_EN_PATHS = [
  "/plus",
  "/get-help",
  "/attorneys",
  "/accredited-representatives",
  "/legal-aid",
  "/dso",
  "/community-orgs",
  "/pro-bono-representation",
];

const LOCALE_COOKIE = "casewhy_locale";

export function AuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  // Gated on session, not path — several public marketing pages (e.g. /plus,
  // /news) are also NAV_LINKS entries, and a signed-out visitor landing on
  // one of those must never see the signed-in-only links (Dashboard,
  // Settings, etc.), regardless of which page they're on.
  const isSignedIn = !isPending && !!session?.user;

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

  useEffect(() => {
    if (!mounted) return;
    if (onEsPath) {
      document.cookie = `${LOCALE_COOKIE}=es; path=/; max-age=2592000`; // 30 days
      setLocaleCookie("es");
    } else if (TRANSLATED_EN_PATHS.includes(pathname)) {
      document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
      setLocaleCookie(null);
    }
  }, [pathname, mounted, onEsPath]);

  const isSpanish = onEsPath || (mounted && localeCookie === "es");
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
        <Link href="/">
          <Logo />
        </Link>

        {isSignedIn && (
          <div className="relative order-3 w-full sm:order-none sm:w-auto">
            <nav
              ref={navScrollRef}
              className="flex gap-x-5 gap-y-1 overflow-x-auto text-sm"
            >
              {NAV_LINKS.map((link) => {
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
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href={localizeHref("/get-help")} className="text-muted hover:text-foreground">
              {isSpanish ? "Obtener ayuda" : "Get Help"}
            </Link>
            <Link
              href="/auth/sign-in"
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
