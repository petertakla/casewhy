import Link from "next/link";
import { localeToggleHref } from "@/lib/i18n/locale-href";

// Round 99 — extracted from ~23 page-local copies of the same three lines
// (round 82's own switcher, never actually componentized). Two real
// underlying i18n architectures exist in this codebase and this one
// component serves both: round-79-style pages (separate /es/* routes,
// each file always links one direction — pass `href` directly) and
// round-82-style pages (one route, `?lang=es` + a sticky cookie, same
// file serves both languages — pass `basePath`/`params` and let
// localeToggleHref compute the link). Either way the label, hrefLang,
// and styling are identical, which is exactly what was inconsistent
// before this round (round 97's /faq and /sitemap copied /plus's
// `mb-6` spacing, not the `mb-2` every other standalone page actually
// uses -- this component standardizes on `mb-2`, the real majority).
//
// `variant="inline"` renders a bare link with no wrapping div, for the
// detail pages that place the switcher next to <BackLink> inside their
// own flex row rather than as a standalone top-of-page element.

interface LanguageSwitcherProps {
  /** Current page's language. */
  es: boolean;
  /** Fixed-route pages (round 79): the explicit target URL. */
  href?: string;
  /** Same-route pages (round 82): base path for localeToggleHref. */
  basePath?: string;
  /** Same-route pages: extra query params to preserve across the toggle. */
  params?: Record<string, string | undefined>;
  variant?: "standalone" | "inline";
}

export function LanguageSwitcher({ es, href, basePath, params, variant = "standalone" }: LanguageSwitcherProps) {
  const targetHref = href ?? localeToggleHref(basePath ?? "", params ?? {}, es);
  const targetLangAttr = es ? "en" : "es";
  const label = es ? "English" : "Español";

  const link = (
    <Link
      href={targetHref}
      hrefLang={targetLangAttr}
      lang={targetLangAttr}
      className={variant === "inline" ? "text-sm text-brand-600 hover:underline dark:text-brand-400" : "text-brand-600 hover:underline dark:text-brand-400"}
    >
      {label}
    </Link>
  );

  if (variant === "inline") return link;
  return <div className="mb-2 text-right text-sm">{link}</div>;
}
