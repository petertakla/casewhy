import type { Metadata } from "next";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/organization-jsonld";
import { PublicPage } from "@/components/PublicPage";
import { publicPagesFor } from "@/lib/site/pages";
import { SitemapFilter, type SitemapSection } from "@/components/SitemapFilter";

// Round 73 — a human-readable site index, distinct from sitemap.xml (the
// machine-readable one at src/app/sitemap.ts). Same underlying goal
// (discoverability) but for people and for crawlers that weight a real,
// linked-to HTML page higher than a bare XML file — and it doubles as one
// more real internal-link path into every public section, which sitemap.xml
// alone doesn't provide. See round73-seo-geo-foundation-task.md.
//
// Round 99 — rendered from the shared registry (src/lib/site/pages.ts)
// instead of its own SECTIONS array, which had drifted from reality: it
// linked "/" (a permanent redirect since round 74, bouncing the visitor
// straight off the app) instead of /dashboard, and its legal links hit
// casewhy.com/privacy.html — a 308 to www. on every click.

export const metadata: Metadata = {
  title: "Site Index | CaseWhy",
  description: "Every public page on CaseWhy, in one place.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/sitemap",
      es: "https://app.casewhy.com/es/sitemap",
    },
  },
};

const SECTIONS = ["CaseWhy", "Get help", "Reference", "Legal"] as const;

// Round 110 follow-up — see /faq's own comment: statically prerendered,
// which bailed the root layout's session-dependent AuthHeader to client-
// only rendering, missing from the initial HTML.
export const dynamic = "force-dynamic";

export default function SiteIndexPage() {
  return (
    <PublicPage es={false} switcherHref="/es/sitemap">
      {/* Round 93 — app.casewhy.com's actual root ("/") only ever issues a
          308 redirect to casewhy.com and never renders a body, so it can't
          carry this schema. This page is app.casewhy.com's real, always-
          served, public "everything" page, making it the closest honest
          substitute for a root-level Organization/WebSite tag on this
          domain. casewhy.com's own index.html carries the same schema
          directly, since that page genuinely is the root. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />

      <h1 className="text-2xl font-bold tracking-tight">Site index</h1>
      <p className="mb-8 mt-2 text-muted">Every public page on CaseWhy, in one place.</p>

      <SitemapFilter
        sections={SECTIONS.map((section): SitemapSection => ({
          name: section,
          entries: publicPagesFor(section)
            .filter((p) => p.showInIndex)
            .map((entry) => ({ href: entry.href, label: entry.label, external: entry.external })),
        })).filter((s) => s.entries.length > 0)}
        placeholder="Filter this index…"
        noMatchText="No pages match."
        externalLabelSuffix=" ↗"
      />

      {/* Round 102 — moved out of the Reference section (where it read as
          a broken seventh list item, body-sized, right under FAQ) to the
          end of <main>, small and muted, same as a real footnote. */}
      <p className="mt-8 text-xs text-muted">
        Looking for the machine-readable version? See{" "}
        <a href="/sitemap.xml" className="text-brand-600 hover:underline dark:text-brand-400">
          sitemap.xml
        </a>
        , which also lists every individual directory listing and policy-memo permalink.
      </p>
    </PublicPage>
  );
}
