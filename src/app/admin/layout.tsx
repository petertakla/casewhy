import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getAdminPendingCounts } from "@/lib/admin/nav-counts";
import { AdminShellClient } from "./AdminShellClient";

// Round 98 — the shared shell every /admin/* page now renders inside.
// Does the isAdminEmail gate once, here, for the UX (redirect before any
// admin content ever flashes on screen) -- every individual page keeps
// its own identical check too, per the task doc's explicit instruction,
// since that per-page check is the real security boundary and this
// layout-level one is just a better experience layered on top of it,
// not a replacement for it.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const pendingCounts = await getAdminPendingCounts();

  return <AdminShellClient pendingCounts={pendingCounts}>{children}</AdminShellClient>;
}
