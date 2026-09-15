import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteFooter } from "./SiteFooter";

// Round 99 — the shared shell for public pages: fixed content width
// (max-w-3xl, the width the majority of public pages already used --
// /faq was the outlier at max-w-2xl), the language switcher in its
// standard position, and the footer. Scoped to /faq, /sitemap, and their
// Spanish twins this round, per the task doc's own instruction to note
// (not sweep) every other public page still setting its own width.

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
      <SiteFooter es={es} />
    </main>
  );
}
