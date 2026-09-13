// Round 82 — split out from locale.ts so client components (the auth pages)
// can build a language-switcher link without pulling in next/headers, which
// only works in a Server Component.
export function localeToggleHref(
  pathname: string,
  params: Record<string, string | undefined>,
  es: boolean
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== "lang" && value) search.set(key, value);
  }
  search.set("lang", es ? "en" : "es");
  return `${pathname}?${search.toString()}`;
}
