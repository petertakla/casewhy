// Round 73 follow-up (Sep 18) — every public page independently exports
// its own `metadata` object (title/description), but none set
// `alternates.canonical` or Open Graph/Twitter card fields -- confirmed
// live: zero canonical tags across 14+ checked app pages, and shared
// links render as a bare URL with no preview. This wraps a page's own
// title/description into a consistent canonical + OG + Twitter shape
// instead of repeating that boilerplate in 29+ files.
//
// Paths stay relative (`/faq`, not `https://app.casewhy.com/faq`) --
// `metadataBase` on the root layout (layout.tsx) resolves them, per
// Next.js's own documented pattern for exactly this case.

import type { Metadata } from "next";

const DEFAULT_OG_IMAGE = "/og-default.png";

export function pageMetadata(
  path: string,
  {
    title,
    description,
    image,
    locale,
    languages,
  }: {
    title: string;
    description: string;
    image?: string;
    locale?: "en" | "es";
    languages?: Record<string, string>;
  },
): Metadata {
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: path, ...(languages ? { languages } : {}) },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "CaseWhy",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
