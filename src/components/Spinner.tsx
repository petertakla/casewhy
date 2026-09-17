// Round 114 follow-up, Finding 4 — the one spinner every pending-state UI
// in the app uses, so a user learns its meaning once. Respects
// prefers-reduced-motion by falling back to a static (non-spinning) ring
// rather than removing the affordance entirely.

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} motion-safe:animate-spin`}
      role="presentation"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
