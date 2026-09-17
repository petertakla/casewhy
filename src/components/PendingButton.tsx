"use client";

// Round 114 follow-up, Finding 4 — the shared pending-state pattern for
// every server-bound button in the app: Peter's own report was that a
// click with no visible feedback reads as "did nothing," and the natural
// response is to click again — explaining part of the four-click dashboard
// experience the round 114 second follow-up separately fixed the cause of.
// This is the visual half: within the same render pass as `pending`
// flipping true (React's own synchronous state-update-before-paint
// behavior already satisfies "within 100ms" without extra engineering),
// the button shows a spinner, swaps its label, goes disabled with
// aria-busy, and a second click is a no-op since the button is disabled.
// After `waitingDelayMs` (default 10s) still pending, a muted line
// appears so a genuinely slow real API call doesn't read as broken.
//
// Deliberately controlled, not self-managing: callers wire `pending` from
// whatever async mechanism they already use (useTransition's isPending
// for a server action, local isPending state for a plain fetch, or a
// router-transition's isPending for a GET-navigating form) rather than
// this component owning the async call itself -- the call shapes differ
// too much across this app's real usages to unify further than the UI.

import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

export function PendingButton({
  pending,
  pendingLabel,
  waitingLabel,
  waitingDelayMs = 10000,
  children,
  type = "button",
  onClick,
  disabled,
  className,
  spinnerClassName = "h-4 w-4",
}: {
  pending: boolean;
  /** Shown in place of `children` while pending, e.g. "Looking up…" */
  pendingLabel: string;
  /** Shown below the button once still pending past waitingDelayMs, e.g. "Still waiting on USCIS…". Omit to skip the waiting line entirely. */
  waitingLabel?: string;
  waitingDelayMs?: number;
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className: string;
  spinnerClassName?: string;
}) {
  const [showWaiting, setShowWaiting] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShowWaiting(false);
      return;
    }
    const timer = setTimeout(() => setShowWaiting(true), waitingDelayMs);
    return () => clearTimeout(timer);
  }, [pending, waitingDelayMs]);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || pending}
        aria-busy={pending}
        className={className}
      >
        {pending && <Spinner className={spinnerClassName} />}
        {pending ? pendingLabel : children}
      </button>
      {pending && showWaiting && waitingLabel && <span className="text-xs text-muted">{waitingLabel}</span>}
    </span>
  );
}
