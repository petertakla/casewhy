"use client";

// Round 44, placement 4 — a soft, dismissible "tell a friend" prompt shown
// only on a genuinely positive status-change moment (approval, card
// delivered, oath ceremony — see statusTone() in dashboard/page.tsx, the
// same detection already used for the status pill's color). Deliberately
// generic: this is triggered by the user's own good news, but the shared
// content itself never states what that news was — no receipt number, no
// status text, nothing account-specific, per the round's own hard rule.
// Takes no props at all for that reason; there's nothing case-specific to
// pass in even if a future caller wanted to.

import { useState } from "react";
import { ShareButton } from "@/components/ShareButton";

export function PositiveShareNudge() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-4">
      <p className="text-sm text-foreground/90">
        Know someone else waiting on a case? Tell them about CaseWhy.
      </p>
      <div className="flex items-center gap-2">
        <ShareButton
          url="https://casewhy.com"
          title="CaseWhy"
          text="Just used CaseWhy to keep track of my USCIS case — it explains what's actually happening in plain English and connects you to real help. Free, no ads, ever."
          label="Share"
        />
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-xs text-muted hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
