import type { Metadata } from "next";
import "./globals.css";
import { AuthHeader } from "@/components/AuthHeader";

export const metadata: Metadata = {
  title: "CaseWhy — Understand your USCIS case",
  description:
    "AI-explained USCIS case status tracking. Know what's happening with your immigration case, and why.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthHeader />
        {children}
      </body>
    </html>
  );
}
