"use client";

// Round 114 follow-up, Finding 4 (extended) — the "thin top progress bar
// for every page transition that isn't instant" layer. Reads the single
// shared navigation-pending signal (NavigationProvider), not a per-page
// implementation, so it fires for any navigation that goes through
// useAppNavigation() anywhere in the app, without each call site needing
// to know about it.

import { useEffect, useState } from "react";
import { useAppNavigation } from "@/lib/navigation/NavigationProvider";

export function TopProgressBar() {
  const { isPending } = useAppNavigation();
  const [visible, setVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (isPending) {
      setFinishing(false);
      setVisible(true);
      return;
    }
    if (!visible) return;
    // Snap to 100% and fade rather than just disappearing mid-grow --
    // the bar should always read as "finished," never "interrupted."
    setFinishing(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setFinishing(false);
    }, 220);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="fixed left-0 top-0 z-[100] h-0.5 w-full overflow-hidden bg-transparent">
      <div
        className={
          finishing
            ? "h-full w-full bg-brand-500 opacity-0 transition-[opacity] duration-200 ease-out"
            : "h-full bg-brand-500 [animation:top-progress-grow_8s_ease-out_forwards]"
        }
      />
    </div>
  );
}
