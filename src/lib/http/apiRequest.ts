// Round 114 follow-up, Finding 4 (extended) — the one place a client
// component reaches an internal API route from. Deliberately a thin
// wrapper, not a full data-fetching hook: every call site already has
// its own pending/error state shape (useTransition, useState, whatever
// fits that component), and forcing all of them into one hook's opinion
// of that shape would be a bigger, riskier rewrite than what this round
// actually needs. What every real call site was genuinely missing,
// confirmed by reading all of them before writing this: a timeout.
// Every one of these fetch() calls could hang indefinitely with no way
// out -- the pending state some of them already showed had no ceiling.
// This adds one, with a real distinguishable error type so a caller can
// show a different message for "timed out" vs "the server said no."
//
// A lint rule (no-restricted-syntax, .eslintrc) forbids raw fetch(...)
// in "use client" components going forward -- this file is the one
// exempted call site.

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
  }
}

export interface ApiRequestOptions extends RequestInit {
  /** Default 15s. Every real call site checked before writing this file used well under that for a normal response. */
  timeoutMs?: number;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  // A caller-supplied signal (rare) aborts the request too, without
  // losing our own timeout abort.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError" && !signal?.aborted) {
      throw new ApiTimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
