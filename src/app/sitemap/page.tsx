import type { Metadata } from "next";
import Link from "next/link";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/organization-jsonld";
import { PublicPage } from "@/components/PublicPage";
import { publicPagesFor } from "@/lib/site/pages";

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

      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const entries = publicPagesFor(section).filter((p) => p.showInIndex);
          if (entries.length === 0) return null;
          return (
            <div key={section}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{section}</h2>
              <ul className="space-y-2 text-sm">
                {entries.map((entry) =>
                  entry.external ? (
                    <li key={entry.href}>
                      <a href={entry.href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                        {entry.label} ↗
                      </a>
                    </li>
                  ) : (
                    <li key={entry.href}>
                      <Link href={entry.href} className="text-brand-600 hover:underline dark:text-brand-400">
                        {entry.label}
                      </Link>
                    </li>
                  )
                )}
                {section === "Reference" && (
                  <li>
                    Looking for the machine-readable version? See{" "}
                    <a href="/sitemap.xml" className="text-brand-600 hover:underline dark:text-brand-400">
                      sitemap.xml
                    </a>
                    , which also lists every individual directory listing and policy-memo permalink.
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </PublicPage>
  );
}
