import type { MetadataRoute } from "next";

// Round 73 — app.casewhy.com had never had a robots.txt at all (confirmed:
// zero site:app.casewhy.com results). Disallow list is auth-gated/
// transactional/infrastructure routes only; every public directory,
// knowledge-base, and marketing page stays crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/settings",
        "/ask",
        "/auth/",
        "/admin/",
        "/api/",
        "/policy-update",
      ],
    },
    sitemap: "https://app.casewhy.com/sitemap.xml",
  };
}
