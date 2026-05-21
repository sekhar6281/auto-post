// Simple in-memory rate limiter.
// NOTE: This is process-local — on multi-instance / serverless deployments
// each worker has its own store. For true global rate limiting use Redis
// (e.g. @upstash/ratelimit). This still stops casual abuse within one process.

interface RateLimitEntry {
  count:   number;
  resetAt: number;
}

// Hard cap on store size to prevent memory exhaustion from a flood of unique keys
const MAX_STORE_SIZE = 10_000;
const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max:      number; // max requests per window
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  // If the store is at capacity, run an emergency cleanup first
  if (store.size >= MAX_STORE_SIZE) {
    for (const [k, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(k);
    }
    // If still at capacity after cleanup, fail open to avoid blocking all users
    if (store.size >= MAX_STORE_SIZE) {
      console.warn("[rateLimit] Store at capacity — failing open for key:", key);
      return { allowed: true, retryAfter: 0 };
    }
  }

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= opts.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// Cleanup expired entries every 5 minutes to keep memory tidy
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);
