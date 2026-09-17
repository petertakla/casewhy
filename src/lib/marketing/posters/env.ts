// Round 90 prep — Vercel env-var placeholders task's own guard rail:
// "App code must treat REPLACE_ME (or empty) as 'channel not configured'
// and log one line, never throw at build or request time." Before this,
// each poster's requireCredentials() only checked truthiness -- a literal
// "REPLACE_ME" string is truthy, so it would have passed the check and
// made a real API call with that literal string as the credential,
// failing with a confusing live 401/403 instead of a clean, honest "not
// configured yet" error. This is the one place that sentinel is defined,
// shared across every poster.

const PLACEHOLDER_VALUE = "REPLACE_ME";

/** True when an env var is unset, empty, or still the literal placeholder value. */
export function isUnconfigured(value: string | undefined): boolean {
  return !value || value === PLACEHOLDER_VALUE;
}
