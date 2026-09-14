// Round 93 — Organization + WebSite JSON-LD, shared by every place that
// needs it on the app.casewhy.com side (see organizationJsonLd() callers).
// `sameAs` is env-driven and deliberately empty by default: no real
// CaseWhy social accounts exist yet (per the task doc's own note), so
// this omits the field entirely rather than shipping placeholder/fake
// profile URLs -- set SOCIAL_SAME_AS_URLS (comma-separated) once real
// accounts exist.

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
