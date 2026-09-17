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

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

interface NavigationContextValue {
  isPending: boolean;
  navigate: (url: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(url: string) {
    startTransition(() => {
      router.push(url);
    });
  }

  return <NavigationContext.Provider value={{ isPending, navigate }}>{children}</NavigationContext.Provider>;
}

export function useAppNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useAppNavigation() must be called within <NavigationProvider>, which wraps the whole app in the root layout.");
  }
  return ctx;
}
