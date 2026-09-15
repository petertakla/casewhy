"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { PUBLIC_PAGES, showSiteFooter } from "@/lib/site/pages";
import { useIsSpanish } from "@/lib/i18n/use-is-spanish";

// Round 99 — the footer FAQ and the site index never had (they each
// ended in a one-off closing paragraph instead). Renders from the same
// registry the site index and sitemap.ts read from, so a page that's
// footer-worthy is declared once (showInFooter: true), not copy-pasted
// into a fourth hand-maintained list.
//
// Round 101 — mounted once in src/app/layout.tsx (no longer passed an
// `es` prop or scoped to PublicPage.tsx's four pages). It now computes
// its own pathname/locale via useIsSpanish() — the same hook AuthHeader
// uses — so the header and footer can never disagree the way the header
// and the admin shell did in round 98 (a child component's one-time
// cookie read racing the parent's own clearing effect). Renders nothing
// on paths with their own equivalent chrome (showSiteFooter()).

function SiteFooterInner() {
  const pathname = usePathname();
  const es = useIsSpanish();

  if (!showSiteFooter(pathname)) return null;

  const entries = PUBLIC_PAGES.filter((p) => p.showInFooter);

  return (
    <footer className="mx-auto mt-16 max-w-3xl border-t border-border px-6 pt-6 text-sm text-muted">
      <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={es ? "Pie de página" : "Footer"}>
        {entries.map((entry) => {
          const href = es && entry.hrefEs ? entry.hrefEs : entry.href;
          const label = es && entry.labelEs ? entry.labelEs : entry.label;
          const untranslated = es && !entry.hrefEs && !entry.href.startsWith("mailto:");
          return (
            <a
              key={entry.href}
              href={href}
              {...(entry.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="hover:text-foreground hover:underline"
            >
              {label}
              {untranslated && <span className="text-muted"> (en inglés)</span>}
            </a>
          );
        })}
      </nav>
      <p className="mt-4 pb-6 text-xs">&copy; 2026 CaseWhy. {es ? "No afiliado ni respaldado por USCIS o DHS." : "Not affiliated with or endorsed by USCIS or DHS."}</p>
    </footer>
  );
}

// useSearchParams() (inside useIsSpanish) requires a Suspense boundary for
// any page that's part of static generation — same reason AuthHeader.tsx
// wraps itself, and for the same reason: this renders on every page via
// the root layout, including statically-prerendered pages.
export function SiteFooter() {
  return (
    <Suspense fallback={null}>
      <SiteFooterInner />
    </Suspense>
  );
}
