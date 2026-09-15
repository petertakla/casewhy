import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Round 99 — the shared shell for public pages: fixed content width
// (max-w-3xl, the width the majority of public pages already used --
// /faq was the outlier at max-w-2xl) and the language switcher in its
// standard position. Scoped to /faq, /sitemap, and their Spanish twins
// this round, per the task doc's own instruction to note (not sweep)
// every other public page still setting its own width.
//
// Round 101 — the footer moved out of here into the root layout
// (SiteFooter is now mounted globally and self-determines visibility via
// showSiteFooter()), so this component no longer renders one itself.

interface PublicPageProps {
  es: boolean;
  /** Fixed-route pages (round 79): the explicit switcher target URL. */
  switcherHref?: string;
  /** Same-route pages (round 82): base path for the switcher's localeToggleHref. */
  switcherBasePath?: string;
  switcherParams?: Record<string, string | undefined>;
  children: ReactNode;
}

export function PublicPage({ es, switcherHref, switcherBasePath, switcherParams, children }: PublicPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={es} href={switcherHref} basePath={switcherBasePath} params={switcherParams} />
      {children}
    </main>
  );
}
