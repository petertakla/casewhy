import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Deploy target: Vercel. */
  // Round 69 — middleware.ts now needs a direct Postgres connection (pg's
  // raw TCP Pool), which the default Edge middleware runtime can't support.
  // Requires this flag in Next.js 15.5 for `export const config = { runtime:
  // "nodejs" }` in middleware.ts to actually register — confirmed by a real
  // empty middleware-manifest.json (middleware silently didn't register at
  // all) before this flag was added.
  // Cast needed: this Next.js version's bundled ExperimentalConfig type
  // doesn't declare nodeMiddleware yet, even though the flag is real and
  // recognized at runtime (confirmed in build output: "Experiments (use
  // with caution): ✓ nodeMiddleware").
  experimental: {
    nodeMiddleware: true,
  } as unknown as NextConfig["experimental"],
};

export default nextConfig;
