// Round 110 — a tiny window CustomEvent bus so the Resources menu's
// search box (ResourcesMenu.tsx) and the header's search icon
// (AuthHeader.tsx) can both open the one SiteSearch overlay instance
// (mounted once in AuthHeader) without prop-drilling through a component
// that doesn't otherwise know about search, or standing up a React
// context provider for a single open(query?) call.

export const SEARCH_OPEN_EVENT = "casewhy:open-search";

export function openSiteSearch(query?: string): void {
  window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT, { detail: { query } }));
}
