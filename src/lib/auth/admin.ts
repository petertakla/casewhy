// Round 70 — gates the new alias-config and pending-approval-queue admin
// screens to Peter's own account only. Same presence/env-var pattern as
// ACCEPTANCE_TESTING_EMAIL in src/middleware.ts: ADMIN_EMAIL unset means
// nothing can pass this check, not "anyone can" — a fail-closed default
// for a screen that can trigger real emails going out under casewhy.com's
// own name.

export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}
