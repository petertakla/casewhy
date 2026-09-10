import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Deploy target: Vercel. */
  // Round 63 — jsdom (used by @mozilla/readability for news-article
  // extraction) ships a sub-dependency (html-encoding-sniffer ->
  // @exodus/bytes) that's ESM-only but require()'d as CJS. Next.js's own
  // webpack bundling of server code breaks this; excluding jsdom from
  // bundling and letting it load natively from node_modules at runtime
  // (the standard fix for this exact class of jsdom/Next.js issue) fixes
  // it — confirmed by reproducing the real production 500 first, not
  // guessed at.
  serverExternalPackages: ["jsdom"],
};

export default nextConfig;
