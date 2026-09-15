"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";
import { PUBLIC_PAGES } from "@/lib/site/pages";
import { Logo } from "./Logo";
import { ResourcesMenu } from "./ResourcesMenu";
import { PlusBadge } from "./PlusBadge";
import { SiteSearch } from "./SiteSearch";

// Round 101 — Processing times, Visa bulletin, and News moved out of here
// into the registry-driven Resources menu (see ResourcesMenu.tsx); this
// keeps only the five links that are actually app features, not reference
// content. The reference set living in PUBLIC_PAGES (not a second hand
// list here) is the whole point of this round's standing rule.
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", labelEs: "Panel" },
  { href: "/ask", label: "Ask a question", labelEs: "Hacer una pregunta" },
  // Round 109 — label kept as plain "CaseWhy Plus" for anything reading
  // this list as data (e.g. a screen reader with CSS disabled); the badge
  // treatment is applied in renderNavLink() below, which special-cases
  // this one href instead of rendering link.label literally.
  { href: "/plus", label: "CaseWhy Plus" },
  { href: "/get-help", label: "Get Help", labelEs: "Obtener ayuda" },
  { href: "/settings", label: "Settings", labelEs: "Configuración" },
];

// Round 98 — appended separately (not just pushed into NAV_LINKS above)
// because it's the one nav entry gated on more than "signed in": it only
// renders for admin@casewhy.com, checked via /api/admin/is-admin since
// ADMIN_EMAIL itself can never ship to this client component's bundle.
const ADMIN_LINK = { href: "/admin", label: "Admin", labelEs: "Administración" };

// Round 101 — the nav row is now split around the Resources menu (see
// below), so this moved out of the JSX to avoid rendering the same link
// markup twice.
function renderNavLink(
  link: { href: string; label: string; labelEs?: string },
  pathname: string,
  isSpanish: boolean,
  localizeHref: (href: string) => string
) {
  const href = localizeHref(link.href);
  const active = pathname.startsWith(href);
  const className = `whitespace-nowrap pb-0.5 ${
    active ? "border-b-2 border-brand-500 font-semibold text-foreground" : "text-muted hover:text-foreground"
  }`;
  // Round 109 — the one nav item that gets the Plus badge instead of its
  // plain label text. The active-underline (border-b-2, above) is on the
  // Link itself, so it spans both "CaseWhy" and the badge automatically.
  if (link.href === "/plus") {
    return (
      <Link key={link.href} href={href} className={className}>
        CaseWhy <PlusBadge size="sm" />
      </Link>
    );
  }
  return (
    <Link key={link.href} href={href} className={className}>
      {isSpanish && link.labelEs ? link.labelEs : link.label}
    </Link>
  );
}

function AuthHeaderInner() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
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

  // Round 101 — was an inline computation here (rounds 79-83's three
  // follow-ups); now shared with SiteFooter via one hook so the two can
  // never disagree, the same race round 98 hit between the header and the
  // admin shell. See use-is-spanish.ts for the full history of why each
  // piece of this logic exists — moved verbatim, not rewritten.
  const isSpanish = useIsSpanish();

  // Round 101 — retires the old two-entry ES_HREF map in favor of a
  // registry lookup, so /get-help and /plus (and anything else PUBLIC_PAGES
  // ever gains a hrefEs for) come from the same source the footer and site
  // index already read. A href with no matching registry entry — or no
  // hrefEs on the entry it does match — passes through unchanged, same as
  // the old map's fallback.
  function localizeHref(href: string) {
    if (!isSpanish) return href;
    const entry = PUBLIC_PAGES.find((p) => p.href === href);
    return entry?.hrefEs ?? href;
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
        <div className="flex items-center gap-1">
          <Link href={isSpanish ? "/?lang=es" : "/"}>
            <Logo />
          </Link>
          <SiteSearch />
        </div>

        {isSignedIn && (
          <div className="relative order-3 w-full sm:order-none sm:w-auto">
            <nav
              ref={navScrollRef}
              className="flex items-center gap-x-5 gap-y-1 overflow-x-auto text-sm"
            >
              {NAV_LINKS.slice(0, 4).map((link) => renderNavLink(link, pathname, isSpanish, localizeHref))}
              <ResourcesMenu isSpanish={isSpanish} pathname={pathname} />
              {(isAdmin ? [...NAV_LINKS.slice(4), ADMIN_LINK] : NAV_LINKS.slice(4)).map((link) =>
                renderNavLink(link, pathname, isSpanish, localizeHref)
              )}
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
            <ResourcesMenu isSpanish={isSpanish} pathname={pathname} />
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
