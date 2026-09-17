// Round 114 follow-up, Finding 4 (extended) — the route-level safety net
// for any page transition not already wired through useAppNavigation()
// (a plain <Link> click, a direct URL entry, browser back/forward). Next
// renders this automatically inside the root layout (AuthHeader/
// SiteFooter stay) while the target route's async Server Component data
// is still loading. Deliberately generic/content-agnostic -- it covers
// every route, not just one page, so it can't assume a specific layout.
//
// Note: this does NOT fire for navigations wrapped in useAppNavigation's
// startTransition() when the current page already has content on screen
// -- React suppresses Suspense fallbacks during a transition on purpose,
// which is exactly why TopProgressBar and each page's own local pending
// UI (e.g. DashboardSearchArea's skeleton) exist as the client-side
// equivalent for that case. The two mechanisms are complementary, not
// duplicative: this file covers what those can't reach.
export default function RootLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-surface-2" />
      <div className="mt-6 space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-20 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </main>
  );
}
