import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <ServiceWorkerRegister />
        <AuthHeader />
        {children}
      </body>
    </html>
  );
}
