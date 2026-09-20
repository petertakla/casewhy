import { redirect } from "next/navigation";

// Round 119 — this page's own two fields (poll interval, action level)
// are now one section of the consolidated /admin/ops console, alongside
// the new social-channels table and both tables' notes/pending-count
// additions. Redirected rather than left as an orphaned duplicate editing
// surface for the same emailAliasConfigs rows (round 98's own "a page
// that isn't in the registry, or duplicates another, isn't done" rule).
export default function AdminAliasesRedirect() {
  redirect("/admin/ops");
}
