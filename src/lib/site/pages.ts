// Round 99 — the single registry every "list of public pages" surface
// reads from: the human site index (/sitemap, /es/sitemap), sitemap.ts's
// static-path list, and the shared footer (SiteFooter.tsx). Same fix as
// round 98's admin nav.ts, for the public side: before this, three
// different files each hand-maintained their own overlapping list, and a
// new page (round 93's /updates, round 97's /es/faq and /es/sitemap) only
// reached whichever lists someone remembered to update.
//
// DB-backed entity slugs (attorneys/[slug], policy/[id], updates/[slug],
// etc.) deliberately stay out of this registry and out of sitemap.ts's
// own dynamic-fetch logic -- this only covers the fixed, hand-authored
// public pages, per the task doc's own scope.

export interface PublicPageEntry {
  href: string;
  label: string;
  labelEs?: string;
  /** Real Spanish URL, if one exists. Absent means: on the Spanish index, this link stays pointed at `href` and gets an "(en inglés)" tag. */
  hrefEs?: string;
  section: "CaseWhy" | "Get help" | "Reference" | "Legal";
  external?: boolean;
  /** Shown as a card on the human /sitemap index. */
  showInIndex: boolean;
  /** Shown as a link in SiteFooter. */
  showInFooter: boolean;
  /** Included in sitemap.ts's static-path list. */
  showInSitemapXml: boolean;
  /** Round 101 — included as an item in AuthHeader's "Resources" menu. */
  showInHeaderMenu?: boolean;
  /** Round 101 — short label for the Resources menu; falls back to `label` (some entries' full `label` is too long for a compact dropdown). */
  menuLabel?: string;
  menuLabelEs?: string;
}

// Round 101 — paths whose own shell already provides equivalent chrome
// (the round-98 admin sidebar, the chrome-free /auth/* sign-in flow), so
// mounting SiteFooter there too would be a second, redundant footer.
// Prefix match. Client-safe, same split as admin/nav.ts.
export const NO_SITE_FOOTER_PREFIXES = ["/admin", "/auth"];

export function showSiteFooter(pathname: string): boolean {
  return !NO_SITE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const PUBLIC_PAGES: PublicPageEntry[] = [
  // -- CaseWhy --
  {
    href: "https://www.casewhy.com",
    hrefEs: "https://www.casewhy.com/es/",
    label: "casewhy.com — marketing site",
    labelEs: "casewhy.com — sitio de mercadeo",
    section: "CaseWhy",
    external: true,
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: false,
  },
  // The real "/" route itself -- a permanent redirect to casewhy.com
  // since round 74, so it's never a page the human index should send a
  // visitor to (see the /dashboard entry below for that), but it's still
  // a real URL worth keeping in sitemap.xml.
  {
    href: "",
    label: "app.casewhy.com root (redirects to casewhy.com)",
    section: "CaseWhy",
    showInIndex: false,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/dashboard",
    hrefEs: "/dashboard?lang=es",
    label: "Dashboard — track a case (sign in)",
    labelEs: "Panel — rastree un caso (inicie sesión)",
    section: "CaseWhy",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: false,
  },
  {
    href: "/plus",
    hrefEs: "/es/plus",
    label: "CaseWhy Plus — pricing & features",
    labelEs: "CaseWhy Plus — precios y funciones",
    section: "CaseWhy",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },

  // -- Get help --
  {
    href: "/get-help",
    hrefEs: "/es/get-help",
    label: "Get Help — all categories",
    labelEs: "Obtener ayuda — todas las categorías",
    section: "Get help",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
  },
  {
    href: "/get-help/ask",
    label: "Ask CaseWhy — free, no sign-in required",
    labelEs: "Pregúntele a CaseWhy — gratis, sin necesidad de iniciar sesión",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/attorneys",
    hrefEs: "/es/attorneys",
    label: "Find an immigration attorney",
    labelEs: "Encuentre un abogado de inmigración",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  { href: "/attorneys/join", label: "Attorney directory — join", section: "Get help", showInIndex: false, showInFooter: false, showInSitemapXml: true },
  {
    href: "/accredited-representatives",
    hrefEs: "/es/accredited-representatives",
    label: "Find a DOJ-accredited representative",
    labelEs: "Encuentre un representante acreditado por el DOJ",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/accredited-representatives/join",
    label: "Accredited representative directory — join",
    section: "Get help",
    showInIndex: false,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/legal-aid",
    hrefEs: "/es/legal-aid",
    label: "Find free & low-cost legal aid",
    labelEs: "Encuentre asistencia legal gratuita o de bajo costo",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  { href: "/legal-aid/join", label: "Legal aid directory — join", section: "Get help", showInIndex: false, showInFooter: false, showInSitemapXml: true },
  {
    href: "/pro-bono-representation",
    hrefEs: "/es/pro-bono-representation",
    label: "Find pro bono immigration-court representation",
    labelEs: "Encuentre representación pro bono en la corte de inmigración",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/pro-bono-representation/join",
    label: "Pro bono representation directory — join",
    section: "Get help",
    showInIndex: false,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/dso",
    hrefEs: "/es/dso",
    label: "Find your school's international student office",
    labelEs: "Encuentre la oficina de estudiantes internacionales de su escuela",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  { href: "/dso/join", label: "DSO directory — join", section: "Get help", showInIndex: false, showInFooter: false, showInSitemapXml: true },
  {
    href: "/community-orgs",
    hrefEs: "/es/community-orgs",
    label: "Find a community or cultural organization",
    labelEs: "Encuentre una organización comunitaria o cultural",
    section: "Get help",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
  },
  {
    href: "/community-orgs/join",
    label: "Community/cultural org directory — join",
    section: "Get help",
    showInIndex: false,
    showInFooter: false,
    showInSitemapXml: true,
  },

  // -- Reference --
  {
    href: "/processing-times",
    label: "USCIS processing times by form",
    labelEs: "Tiempos de procesamiento de USCIS por formulario",
    section: "Reference",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Processing times",
    menuLabelEs: "Tiempos de procesamiento",
  },
  {
    href: "/visa-bulletin",
    label: "Visa bulletin — Final Action Dates",
    labelEs: "Boletín de visas — Fechas de Acción Final",
    section: "Reference",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Visa bulletin",
    menuLabelEs: "Boletín de visas",
  },
  {
    href: "/news",
    label: "Immigration news",
    labelEs: "Noticias de inmigración",
    section: "Reference",
    showInIndex: true,
    showInFooter: false,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Immigration news",
    menuLabelEs: "Noticias de inmigración",
  },
  {
    href: "/policy",
    label: "USCIS policy memos, explained",
    labelEs: "Memorandos de política de USCIS, explicados",
    section: "Reference",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Policy memos",
    menuLabelEs: "Memorandos de política",
  },
  {
    href: "/updates",
    label: "Updates — the CaseWhy blog",
    labelEs: "Actualizaciones — el blog de CaseWhy",
    section: "Reference",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Updates",
    menuLabelEs: "Actualizaciones",
  },
  {
    href: "/faq",
    hrefEs: "/es/faq",
    label: "Frequently asked questions",
    labelEs: "Preguntas frecuentes",
    section: "Reference",
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "FAQ",
    menuLabelEs: "Preguntas frecuentes",
  },
  // Not shown on the index itself (no self-link), but it IS one of the
  // footer's 10 links per the task doc's explicit list.
  {
    href: "/sitemap",
    hrefEs: "/es/sitemap",
    label: "Site index",
    labelEs: "Índice del sitio",
    section: "Reference",
    showInIndex: false,
    showInFooter: true,
    showInSitemapXml: true,
    showInHeaderMenu: true,
    menuLabel: "Site index",
    menuLabelEs: "Índice del sitio",
  },

  // -- Legal --
  // 308 to www. either way -- pointed straight at www. per the task's
  // own "resolve without a redirect hop" verify-live bullet.
  {
    href: "https://www.casewhy.com/privacy.html",
    label: "Privacy Policy",
    labelEs: "Política de Privacidad",
    section: "Legal",
    external: true,
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: false,
  },
  {
    href: "https://www.casewhy.com/terms.html",
    label: "Terms of Service",
    labelEs: "Términos de Servicio",
    section: "Legal",
    external: true,
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: false,
  },
  {
    href: "mailto:hello@casewhy.com",
    label: "Contact — hello@casewhy.com",
    labelEs: "Contacto — hello@casewhy.com",
    section: "Legal",
    external: true,
    showInIndex: true,
    showInFooter: true,
    showInSitemapXml: false,
  },
];

export function publicPagesFor(section: PublicPageEntry["section"]): PublicPageEntry[] {
  return PUBLIC_PAGES.filter((p) => p.section === section);
}
