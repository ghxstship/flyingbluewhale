// In-memory sliding-window rate limiter. Good enough for a single Vercel edge region
// or a single Node server; swap for Upstash Ratelimit when you need distributed state.
// Usage: const ok = await ratelimit({ key: `ai:${session.userId}`, max: 30, windowMs: 60_000 });

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function ratelimit({ key, max, windowMs }: { key: string; max: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  // prune expired
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= max) {
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, resetAt: bucket.timestamps[0] + windowMs };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: max - bucket.timestamps.length, resetAt: now + windowMs };
}

// Map a request to a rate-limit key (IP + path).
export function keyFromRequest(req: Request, prefix: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

// Budgets per endpoint family. Extend as we wire more endpoints.
export const RATE_BUDGETS = {
  auth:     { max: 10,  windowMs: 60_000 },   // 10 / min — login/signup/forgot
  ai:       { max: 30,  windowMs: 60_000 },   // 30 / min — AI chat
  scan:     { max: 120, windowMs: 60_000 },   // 120 / min — field scanning is fast
  webhook:  { max: 300, windowMs: 60_000 },   // Stripe delivery rate
  default:  { max: 60,  windowMs: 60_000 },
} as const;
