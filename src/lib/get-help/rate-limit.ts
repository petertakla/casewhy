// Round 60 Phase B — rate limiting for the anonymous "ask CaseWhy" surface.
// The one genuinely new risk anonymous access introduces: no account to
// throttle against, so every question is a real metered AI Gateway cost
// with no natural cap. Per the task's own explicit instruction, this is a
// lightweight in-memory counter, not a new DB table.
//
// Honest limitation, stated plainly rather than glossed over: this is
// per-warm-instance, not a truly global/distributed limit. Vercel's Fluid
// Compute reuses function instances across concurrent requests (not
// traditional one-request-per-instance serverless), so a real visitor
// hitting the same warm instance repeatedly is bounded correctly in
// practice — but a determined abuser spreading requests across many cold
// starts/instances could exceed the nominal per-IP cap. This is a
// deliberate first-version tradeoff (no new infrastructure/dependency for
// a feature that doesn't have real traffic yet), not something hidden —
// see CLOUD_CLAUDE.md "Round 60" for the real number chosen and why, and
// revisit with a durable store (Vercel KV / Upstash) if real usage shows
// this isn't holding.

const WINDOW_MS = 24 * 60 * 60 * 1000;
export const DAILY_CAP_PER_IP = 5;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Bounds unbounded memory growth from a huge number of distinct IPs over a
// long-running instance — a plain size cap is enough here, this doesn't
// need to be exact.
const MAX_TRACKED_IPS = 50_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkAndConsumeRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    if (buckets.size >= MAX_TRACKED_IPS) buckets.clear();
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: DAILY_CAP_PER_IP - 1 };
  }

  if (existing.count >= DAILY_CAP_PER_IP) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: DAILY_CAP_PER_IP - existing.count };
}

/** Extracts a real client identifier from standard proxy headers (Vercel sets x-forwarded-for). Falls back to a constant key if genuinely unavailable, which degrades to a single shared bucket rather than failing open with no limit at all. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
