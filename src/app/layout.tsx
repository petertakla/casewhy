import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthHeader } from "@/components/AuthHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
  // Round 84 — checked live for a Bing verification artifact (meta tag,
  // BingSiteAuth.xml, DNS TXT record) on this domain and found none,
  // despite an earlier memory note saying Bing was verified — flagging
  // that discrepancy rather than trusting it. Creating the actual Bing
  // Webmaster Tools property is an account-level action only Peter can
  // do (same reasoning as Search Console itself). Once he has a
  // verification code from Bing, drop it into `other` below, e.g.:
  //   other: { "msvalidate.01": "PASTE_BING_CODE_HERE" }
  // No placeholder value is set here on purpose — an empty content
  // attribute would render a confusing, non-functional meta tag into
  // production HTML instead of doing nothing until a real code exists.
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
          <ServiceWorkerRegister />
          <AuthHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
