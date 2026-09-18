import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import { PublicPage } from "@/components/PublicPage";
import { publicPagesFor, type PublicPageEntry } from "@/lib/site/pages";
import { SitemapFilter, type SitemapSection } from "@/components/SitemapFilter";

// Round 97 item 4 — Spanish translation of /sitemap (round 73 item 7).
// Round 99 — rendered from the shared registry instead of its own
// SECTIONS array (see /sitemap/page.tsx's own comment for why that
// mattered: the two lists had already started drifting). Each link
// points at the Spanish version of its target where one exists;
// everything else stays pointed at the English page with an explicit
// "(en inglés)" tag rather than silently linking to English.

export const metadata: Metadata = pageMetadata("/es/sitemap", {
  title: "Índice del Sitio | CaseWhy",
  description:
    "Todas las páginas públicas de CaseWhy en un solo lugar — directorios de abogados y asistencia legal, noticias, políticas explicadas y preguntas frecuentes.",

  locale: "es",
  languages: {
    en: "https://app.casewhy.com/sitemap",
    es: "https://app.casewhy.com/es/sitemap",
  },
});

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

// Round 110 follow-up — see /faq's own comment: statically prerendered,
// which bailed the root layout's session-dependent AuthHeader to client-
// only rendering.
export const dynamic = "force-dynamic";

export default function SiteIndexPageEs() {
  return (
    <PublicPage es={true} switcherHref="/sitemap">
      <h1 className="text-2xl font-bold tracking-tight">Índice del sitio</h1>
      <p className="mb-8 mt-2 text-muted">
        Todas las páginas públicas de CaseWhy, en un solo lugar.
      </p>

      <SitemapFilter
        sections={SECTIONS.map((section): SitemapSection => ({
          name: SECTION_LABELS_ES[section],
          entries: publicPagesFor(section)
            .filter((p) => p.showInIndex)
            .map((entry) => {
              const { href, label, englishOnly } = targetFor(entry);
              return { href, label, external: entry.external, englishOnly };
            }),
        })).filter((s) => s.entries.length > 0)}
        placeholder="Filtrar este índice…"
        noMatchText="Ninguna página coincide."
        externalLabelSuffix=" ↗"
      />

      {/* Round 102 — moved out of the Reference section, same fix as the
          English page. */}
      <p className="mt-8 text-xs text-muted">
        ¿Busca la versión legible por máquina? Consulte{" "}
        <a
          href="/sitemap.xml"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          sitemap.xml
        </a>
        , que también incluye cada listado del directorio y cada permalink de
        memorando.
      </p>
    </PublicPage>
  );
}
