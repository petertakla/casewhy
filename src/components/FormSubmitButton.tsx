"use client";

// Round 114 follow-up, Finding 4 — same shared pending pattern as
// PendingButton, for a <form action={serverAction}> submit button
// specifically (a real server-action form, not a client fetch/router
// transition) — useFormStatus() only works inside the <form> it reports
// on, so this has to be its own small client child rather than reusing
// PendingButton directly at the call site.

import { useFormStatus } from "react-dom";
import { PendingButton } from "./PendingButton";

export function FormSubmitButton({
  pendingLabel,
  waitingLabel,
  children,
  className,
  spinnerClassName,
}: {
  pendingLabel: string;
  waitingLabel?: string;
  children: React.ReactNode;
  className: string;
  spinnerClassName?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <PendingButton
      type="submit"
      pending={pending}
      pendingLabel={pendingLabel}
      waitingLabel={waitingLabel}
      className={className}
      spinnerClassName={spinnerClassName}
    >
      {children}
    </PendingButton>
  );
}
