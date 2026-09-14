import type { Metadata } from "next";
import Link from "next/link";

// Round 97 item 4 — Spanish translation of /sitemap (round 73 item 7).
// Each link points at the Spanish version of its target where one
// exists (rounds 78-83, plus round 97's own new /es/faq); everything
// else stays pointed at the English page with an explicit "(en inglés)"
// tag rather than silently linking to English with no indication.

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

interface IndexLink {
  href: string;
  label: string;
  external?: boolean;
  englishOnly?: boolean;
}

interface IndexSection {
  title: string;
  links: IndexLink[];
}

const SECTIONS: IndexSection[] = [
  {
    title: "CaseWhy",
    links: [
      { href: "https://casewhy.com/es/", label: "casewhy.com — sitio de mercadeo", external: true },
      { href: "/?lang=es", label: "app.casewhy.com — iniciar sesión / rastrear un caso" },
      { href: "/es/plus", label: "CaseWhy Plus — precios y funciones" },
    ],
  },
  {
    title: "Obtener ayuda",
    links: [
      { href: "/es/get-help", label: "Obtener ayuda — todas las categorías" },
      { href: "/get-help/ask", label: "Pregúntele a CaseWhy — gratis, sin necesidad de iniciar sesión", englishOnly: true },
      { href: "/es/attorneys", label: "Encuentre un abogado de inmigración" },
      { href: "/es/accredited-representatives", label: "Encuentre un representante acreditado por el DOJ" },
      { href: "/es/legal-aid", label: "Encuentre asistencia legal gratuita o de bajo costo" },
      { href: "/es/pro-bono-representation", label: "Encuentre representación pro bono en la corte de inmigración" },
      { href: "/es/dso", label: "Encuentre la oficina de estudiantes internacionales de su escuela" },
      { href: "/es/community-orgs", label: "Encuentre una organización comunitaria o cultural" },
    ],
  },
  {
    title: "Referencia",
    links: [
      { href: "/processing-times", label: "Tiempos de procesamiento de USCIS por formulario", englishOnly: true },
      { href: "/visa-bulletin", label: "Boletín de visas — Fechas de Acción Final", englishOnly: true },
      { href: "/policy", label: "Memorandos de política de USCIS, explicados", englishOnly: true },
      { href: "/updates", label: "Actualizaciones — el blog de CaseWhy", englishOnly: true },
      { href: "/news", label: "Noticias de inmigración", englishOnly: true },
      { href: "/es/faq", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "https://casewhy.com/privacy.html", label: "Política de Privacidad", external: true, englishOnly: true },
      { href: "https://casewhy.com/terms.html", label: "Términos de Servicio", external: true, englishOnly: true },
    ],
  },
];

export default function SiteIndexPageEs() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-6 text-right text-sm">
        <Link href="/sitemap" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Índice del sitio</h1>
      <p className="mb-8 mt-2 text-muted">Todas las páginas públicas de CaseWhy, en un solo lugar.</p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
              {section.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {section.links.map((link) =>
                link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {link.label} ↗
                    </a>
                    {link.englishOnly && <span className="text-muted"> (en inglés)</span>}
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="text-brand-600 hover:underline dark:text-brand-400">
                      {link.label}
                    </Link>
                    {link.englishOnly && <span className="text-muted"> (en inglés)</span>}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        ¿Busca la versión legible por máquina? Vea{" "}
        <a
          href="/sitemap.xml"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          sitemap.xml
        </a>
        , que también enumera cada listado de directorio y permalink de memorando de política individual.
      </p>
    </main>
  );
}
