import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { GroupedHowToList } from "@/components/help/HowToList";
import { getAdminHelpEntries } from "@/lib/help/admin-entries";

// Round 120 (admin How-To ask), rebuilt per round 124 on the shared
// src/components/help/ components the public /help page also uses —
// content comes from src/lib/admin/nav.ts's own `howTo` field via
// getAdminHelpEntries(), so a new admin page registers here automatically
// the moment it adds a howTo entry, same "the registry is the single
// source of truth" discipline round 98 established for the sidebar itself.
//
// Gated three ways: middleware.ts (the real stop, added as a round 124
// follow-up fix — see its own comment for the redirect+metadata bug this
// closes), the layout (UX-level, redirects before any admin content
// flashes on screen), and this page's own identical check (defense in
// depth, round 98's standing rule). getAdminHelpEntries() is never
// imported by anything under src/app/help/, so a non-admin session
// reaching /help has no code path that can ever pull in admin content in
// the first place.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How-To guide | Admin | CaseWhy",
};

export default async function AdminHowToPage() {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const entries = getAdminHelpEntries();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">How-To guide</h1>
      <p className="mb-8 mt-2 text-muted">What each admin page does and how to use it. Only the admin account can see this page.</p>
      <GroupedHowToList entries={entries} />
    </div>
  );
}
