import type { Metadata } from "next";
import Link from "next/link";

// Round 73 — a human-readable site index, distinct from sitemap.xml (the
// machine-readable one at src/app/sitemap.ts). Same underlying goal
// (discoverability) but for people and for crawlers that weight a real,
// linked-to HTML page higher than a bare XML file — and it doubles as one
// more real internal-link path into every public section, which sitemap.xml
// alone doesn't provide. See round73-seo-geo-foundation-task.md.

export const metadata: Metadata = {
  title: "Site Index | CaseWhy",
  description: "Every public page on CaseWhy, in one place.",
};

interface IndexLink {
  href: string;
  label: string;
  external?: boolean;
}

interface IndexSection {
  title: string;
  links: IndexLink[];
}

const SECTIONS: IndexSection[] = [
  {
    title: "CaseWhy",
    links: [
      { href: "https://casewhy.com", label: "casewhy.com — marketing site", external: true },
      { href: "/", label: "app.casewhy.com — sign in / track a case" },
      { href: "/plus", label: "CaseWhy Plus — pricing & features" },
    ],
  },
  {
    title: "Get help",
    links: [
      { href: "/get-help", label: "Get Help — all categories" },
      { href: "/get-help/ask", label: "Ask CaseWhy — free, no sign-in required" },
      { href: "/attorneys", label: "Find an immigration attorney" },
      { href: "/accredited-representatives", label: "Find a DOJ-accredited representative" },
      { href: "/legal-aid", label: "Find free & low-cost legal aid" },
      { href: "/pro-bono-representation", label: "Find pro bono immigration-court representation" },
      { href: "/dso", label: "Find your school's international student office" },
      { href: "/community-orgs", label: "Find a community or cultural organization" },
    ],
  },
  {
    title: "Reference",
    links: [
      { href: "/processing-times", label: "USCIS processing times by form" },
      { href: "/visa-bulletin", label: "Visa bulletin — Final Action Dates" },
      { href: "/policy", label: "USCIS policy memos, explained" },
      { href: "/news", label: "Immigration news" },
      { href: "/faq", label: "Frequently asked questions" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "https://casewhy.com/privacy.html", label: "Privacy Policy", external: true },
      { href: "https://casewhy.com/terms.html", label: "Terms of Service", external: true },
    ],
  },
];

export default function SiteIndexPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Site index</h1>
      <p className="mb-8 mt-2 text-muted">Every public page on CaseWhy, in one place.</p>

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
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="text-brand-600 hover:underline dark:text-brand-400">
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        Looking for the machine-readable version? See{" "}
        <a
          href="/sitemap.xml"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          sitemap.xml
        </a>
        , which also lists every individual directory listing and policy-memo permalink.
      </p>
    </main>
  );
}
