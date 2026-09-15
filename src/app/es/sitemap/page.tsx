import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";
import { publicPagesFor, type PublicPageEntry } from "@/lib/site/pages";

// Round 97 item 4 — Spanish translation of /sitemap (round 73 item 7).
// Round 99 — rendered from the shared registry instead of its own
// SECTIONS array (see /sitemap/page.tsx's own comment for why that
// mattered: the two lists had already started drifting). Each link
// points at the Spanish version of its target where one exists;
// everything else stays pointed at the English page with an explicit
// "(en inglés)" tag rather than silently linking to English.

export const metadata: Metadata = {
  title: "Índice del Sitio | CaseWhy",
  description: "Todas las páginas públicas de CaseWhy, en un solo lugar.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/sitemap",
      es: "https://app.casewhy.com/es/sitemap",
    },
  },
};

const SECTIONS = ["CaseWhy", "Get help", "Reference", "Legal"] as const;
const SECTION_LABELS_ES: Record<(typeof SECTIONS)[number], string> = {
  CaseWhy: "CaseWhy",
  "Get help": "Obtener ayuda",
  Reference: "Referencia",
  Legal: "Legal",
};

function targetFor(entry: PublicPageEntry) {
  const englishOnly = !entry.hrefEs;
  const href = entry.hrefEs ?? entry.href;
  const label = entry.labelEs ?? entry.label;
  return { href, label, englishOnly };
}

export default function SiteIndexPageEs() {
  return (
    <PublicPage es={true} switcherHref="/sitemap">
      <h1 className="text-2xl font-bold tracking-tight">Índice del sitio</h1>
      <p className="mb-8 mt-2 text-muted">Todas las páginas públicas de CaseWhy, en un solo lugar.</p>

      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const entries = publicPagesFor(section).filter((p) => p.showInIndex);
          if (entries.length === 0) return null;
          return (
            <div key={section}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{SECTION_LABELS_ES[section]}</h2>
              <ul className="space-y-2 text-sm">
                {entries.map((entry) => {
                  const { href, label, englishOnly } = targetFor(entry);
                  return entry.external ? (
                    <li key={entry.href}>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                        {label} ↗
                      </a>
                      {englishOnly && <span className="text-muted"> (en inglés)</span>}
                    </li>
                  ) : (
                    <li key={entry.href}>
                      <Link href={href} className="text-brand-600 hover:underline dark:text-brand-400">
                        {label}
                      </Link>
                      {englishOnly && <span className="text-muted"> (en inglés)</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Round 102 — moved out of the Reference section, same fix as the
          English page. */}
      <p className="mt-8 text-xs text-muted">
        ¿Busca la versión legible por máquina? Consulte{" "}
        <a href="/sitemap.xml" className="text-brand-600 hover:underline dark:text-brand-400">
          sitemap.xml
        </a>
        , que también incluye cada listado del directorio y cada permalink de memorando.
      </p>
    </PublicPage>
  );
}
