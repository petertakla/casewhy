import { PUBLIC_PAGES } from "@/lib/site/pages";

// Round 99 — the footer FAQ and the site index never had (they each
// ended in a one-off closing paragraph instead). Renders from the same
// registry the site index and sitemap.ts read from, so a page that's
// footer-worthy is declared once (showInFooter: true), not copy-pasted
// into a fourth hand-maintained list.
//
// Mounted only on the pages the round-99 task doc actually scoped this
// round to (/faq, /sitemap, and their Spanish twins, via PublicPage) --
// not the root layout. There's no existing "public page" route group to
// hook a global mount into without restructuring every public route's
// folder, which the task doc explicitly said not to sweep in this round
// ("note which other public pages still set their own width for a later
// sweep — don't sweep them in this round"). The same reasoning applies
// to the footer: mounting it app-wide today would put it on /dashboard,
// /admin/*, and /auth/* too, none of which asked for one.

export function SiteFooter({ es }: { es: boolean }) {
  const entries = PUBLIC_PAGES.filter((p) => p.showInFooter);

  return (
    <footer className="mt-16 border-t border-border pt-6 text-sm text-muted">
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
      <p className="mt-4 text-xs">&copy; 2026 CaseWhy. {es ? "No afiliado ni respaldado por USCIS o DHS." : "Not affiliated with or endorsed by USCIS or DHS."}</p>
    </footer>
  );
}
