// Round 93 — Organization + WebSite JSON-LD, shared by every place that
// needs it on the app.casewhy.com side (see organizationJsonLd() callers).
// `sameAs` is env-driven, still omitted entirely (not a placeholder/fake
// URL) if unset. Round 73 follow-up (Sep 18) — real accounts now exist
// (X, Facebook Page, Threads, Instagram all confirmed working/linked
// this round), so SOCIAL_SAME_AS_URLS is set for real in Vercel now.

function sameAsUrls(): string[] {
  const raw = process.env.SOCIAL_SAME_AS_URLS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function organizationJsonLd() {
  const sameAs = sameAsUrls();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CaseWhy",
    url: "https://casewhy.com",
    logo: "https://app.casewhy.com/icon.svg",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CaseWhy",
    url: "https://app.casewhy.com",
  };
}
