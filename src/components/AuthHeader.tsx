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
  { href: "/get-help", label: "Get Help" },
  { href: "/processing-times", label: "Processing times" },
  { href: "/visa-bulletin", label: "Visa bulletin" },
  { href: "/news", label: "News" },
  { href: "/settings", label: "Settings" },
];

export function AuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  // Gated on session, not path — several public marketing pages (e.g. /plus,
  // /news) are also NAV_LINKS entries, and a signed-out visitor landing on
  // one of those must never see the signed-in-only links (Dashboard,
  // Settings, etc.), regardless of which page they're on.
  const isSignedIn = !isPending && !!session?.user;

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
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`whitespace-nowrap pb-0.5 ${
                      active
                        ? "border-b-2 border-brand-500 font-semibold text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
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
            <Link href="/get-help" className="text-muted hover:text-foreground">
              Get Help
            </Link>
            <Link
              href="/auth/sign-in"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
