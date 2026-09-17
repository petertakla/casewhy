import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthHeader } from "@/components/AuthHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { NavigationProvider } from "@/lib/navigation/NavigationProvider";
import { TopProgressBar } from "@/components/TopProgressBar";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CaseWhy — Understand your USCIS case",
  description:
    "Your USCIS case, explained! AI-explained USCIS case status tracking — know what's happening with your immigration case, and why.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CaseWhy",
  },
  // Google Search Console property verification (app.casewhy.com), added
  // as part of round 73's sitemap-submission follow-up. Don't remove —
  // verification is re-checked periodically, not just at setup time.
  //
  // Round 84 correction: an earlier check here found no Bing verification
  // artifact and left a placeholder for a future msvalidate.01 meta tag.
  // That's now stale — Peter verified both app.casewhy.com and
  // www.casewhy.com in Bing Webmaster Tools via the "import from Google
  // Search Console" flow, which doesn't use a meta tag at all (it trusts
  // the existing GSC verification instead). No code needed here; nothing
  // to add. Both properties' sitemaps are already imported and crawled
  // successfully (confirmed live in Bing Webmaster Tools, Sep 13).
  verification: {
    google: "OxpvzULCMU8GPqyzaWLxHGFbAepeiRLiQjiXYsWvTBQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavigationProvider>
            <TopProgressBar />
            <ServiceWorkerRegister />
            <AuthHeader />
            {children}
            {/* Round 101 — mounted once here (no longer per-page via
                PublicPage.tsx); SiteFooter reads the current path itself and
                renders nothing on /admin/* or /auth/* (showSiteFooter()). */}
            <SiteFooter />
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
