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
  // Round 114 follow-up (Cloud review) — baseline security headers were a
  // real, previously-undisclosed gap (the technical brief said so
  // honestly). HSTS/nosniff/frame-deny/referrer-policy are always safe,
  // non-breaking additions. The CSP is deliberately conservative rather
  // than maximally strict: this app has no next/image remote domains, no
  // externally-hosted fonts (next/font/google self-hosts at build time),
  // and Stripe Checkout/Billing Portal are hosted redirects, not embedded
  // iframes/scripts (round 13's own design choice, "keeps this out of any
  // real PCI scope") -- so 'self' covers almost everything real. Verified
  // locally (sign-in, dashboard, /plus checkout redirect) before shipping,
  // not assumed safe from reading the code alone.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js App Router ships inline hydration/RSC payload
              // scripts -- 'unsafe-inline' on script-src is required for
              // the app to function at all without a nonce-based setup,
              // which is a larger change than this pass's scope.
              // Round 124 follow-up -- 'unsafe-eval' is dev-only: next dev's
              // own Fast Refresh runtime evaluates a stringified module to
              // hot-swap changed files, and without this the browser throws
              // "Evaluating a string as JavaScript violates CSP" from inside
              // webpack's own chunk-loading callback, which was silently
              // crashing client hydration on every route in local dev since
              // this header shipped (confirmed live: password/email inputs
              // and every other client component had zero React event
              // listeners attached -- pure server HTML, no interactivity at
              // all). Production's build has no eval in its runtime, so it
              // stays on the strict policy.
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              // Stripe Checkout/Billing Portal are top-level redirects
              // (startCheckout/openBillingPortal), never embedded --
              // frame-ancestors 'none' both blocks this app from being
              // framed and doesn't need a form-action allowance beyond self.
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
