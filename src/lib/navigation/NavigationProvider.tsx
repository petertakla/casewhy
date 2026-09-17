"use client";

// Round 114 follow-up, Finding 4 (extended) — Peter's own direction: the
// pending-state treatment shouldn't be per-button, it should be universal
// -- "nothing the user does may leave the screen unchanged while the app
// waits on anything." This is the navigation half: a single shared
// useTransition instance, exposed via context, so every navigation in the
// app (Link clicks, programmatic pushes, the dashboard's own receipt
// switching) funnels through the same pending signal. TopProgressBar.tsx
// reads it to show a global top bar; any component can also read
// `isPending` directly for its own local feedback (e.g. dimming the
// specific row that was clicked), same pattern DashboardSearchArea
// already used locally before this was generalized.
//
// Second follow-up, same day — real bug caught in live review: while
// switching tracked receipts, the row/button correctly showed a spinner,
// but the receipt NUMBER shown next to it (the search input, and the
// list's own "active" highlight) still reflected the case the user was
// leaving, not the one they'd just clicked -- both are server props that
// only update once the new page's RSC payload actually lands, so for the
// few seconds a navigation is in flight the screen was showing "Looking
// up..." next to the wrong receipt. Fixed by exposing `targetUrl` here
// too: the URL passed to the most recent navigate() call, cleared once
// that transition actually settles (isPending -> false). Anything that
// names "the receipt currently being looked up" -- the input, the active
// row -- should read this while pending, and fall back to its own
// server-provided value once it's not.

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface NavigationContextValue {
  isPending: boolean;
  /** The URL passed to the in-flight navigate() call, or null when nothing is pending. */
  targetUrl: string | null;
  navigate: (url: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  // A later navigate() call supersedes an earlier one automatically --
  // startTransition already does this (a new transition started before
  // the previous one settles just replaces it) -- this just keeps
  // targetUrl in sync with whichever call is actually the latest.
  function navigate(url: string) {
    setTargetUrl(url);
    startTransition(() => {
      router.push(url);
    });
  }

  useEffect(() => {
    if (!isPending) setTargetUrl(null);
  }, [isPending]);

  return <NavigationContext.Provider value={{ isPending, targetUrl, navigate }}>{children}</NavigationContext.Provider>;
}

export function useAppNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useAppNavigation() must be called within <NavigationProvider>, which wraps the whole app in the root layout.");
  }
  return ctx;
}

/** Reads the `receipt` query param out of a URL string, same shape DashboardSearchArea/TrackedCasesList build their navigation targets with. */
export function extractReceiptFromUrl(url: string): string | null {
  const query = url.split("?")[1];
  if (!query) return null;
  return new URLSearchParams(query).get("receipt");
}
