import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthHeader } from "@/components/AuthHeader";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CaseWhy — Understand your USCIS case",
  description:
    "AI-explained USCIS case status tracking. Know what's happening with your immigration case, and why.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <AuthHeader />
        {children}
      </body>
    </html>
  );
}
