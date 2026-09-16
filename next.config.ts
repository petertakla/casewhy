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
  // Round 91 — ffmpeg-static exports a binary file path, not JS; Next's
  // server bundler tried to resolve/bundle that path as a module and
  // failed at runtime ("spawn .../vendor-chunks/ffmpeg ENOENT"), confirmed
  // by a real local test before this was added. serverExternalPackages
  // tells Next to leave these packages' own require() calls alone instead
  // of bundling them, which is what actually lets the binary be found at
  // its real on-disk path. sharp listed too even though its own test
  // passed without this -- Vercel's actual serverless bundler can behave
  // differently from local `next dev` for native/binary-path packages, so
  // this is a deliberate belt-and-suspenders addition, not just a copy of
  // what already failed.
  serverExternalPackages: ["ffmpeg-static", "sharp"],
};

export default nextConfig;
