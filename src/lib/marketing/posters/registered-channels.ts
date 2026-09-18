// Round 91 — split out of registry.ts. That file imports every poster
// implementation (including youtube.ts, which pulls in googleapis, a
// server-only library) -- fine for a server-only module, but
// MarketingQueueCard.tsx (a client component) imports
// REGISTERED_POSTER_CHANNELS directly, and that import chain was pulling
// googleapis' Node-only dependencies (net, http, ...) into the client
// bundle, a real build failure caught locally before this was ever
// deployed. This file holds just the static channel-name list, safe for
// a client component to import, with zero poster implementation code
// behind it. Keep this list in sync with registry.ts's POSTERS keys by
// hand -- it's a plain array specifically so nothing here can re-import
// server code.
export const REGISTERED_POSTER_CHANNELS: string[] = ["blog", "x", "threads", "pinterest", "youtube", "facebook", "tiktok", "instagram"];
