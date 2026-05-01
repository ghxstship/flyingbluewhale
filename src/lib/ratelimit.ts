// Sliding-window rate limiter. Two backends:
//   1. Upstash REST (preferred) — distributed across Vercel regions, HTTP-only,
//      Edge-runtime safe. Activated when UPSTASH_REDIS_REST_URL +
//      UPSTASH_REDIS_REST_TOKEN are set.
//   2. In-memory Map (fallback) — fine for single-process dev/test or as a
//      degraded mode if Upstash is unreachable.
//
// Usage: const r = await ratelimit({ key: `ai:${session.userId}`, max: 30, windowMs: 60_000 });

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const HAS_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Upstash REST pipeline call. We model the sliding window with a sorted set
// keyed by timestamp:
//   1. ZREMRANGEBYSCORE — drop entries older than the window.
//   2. ZADD — record the new entry.
//   3. ZCARD — count entries currently in the window.
//   4. PEXPIRE — keep the key alive for windowMs so cold buckets self-evict.
// If the count exceeds `max` we deny and tell the caller when the oldest
// entry will roll off so they can populate Retry-After accurately.
async function upstashSlidingWindow(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const pipeline = [
    ["ZREMRANGEBYSCORE", key, "0", String(cutoff)],
    ["ZADD", key, String(now), member],
    ["ZCARD", key],
    ["ZRANGE", key, "0", "0", "WITHSCORES"],
    ["PEXPIRE", key, String(windowMs)],
  ];
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(pipeline),
    // Don't keep TCP open — the Edge runtime closes the request quickly.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const out = (await res.json()) as Array<{ result: unknown }>;
  const count = Number((out[2]?.result as number) ?? 0);
  const oldest = out[3]?.result as [string, string] | string[] | null;
  // ZRANGE returns [member, score, ...] flat; the score is the second element.
  const oldestScore = Array.isArray(oldest) && oldest.length >= 2 ? Number(oldest[1]) : now;
  if (count > max) {
    return { ok: false, remaining: 0, resetAt: oldestScore + windowMs };
  }
  return { ok: true, remaining: Math.max(0, max - count), resetAt: now + windowMs };
}

function inMemorySlidingWindow(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= max) {
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, resetAt: bucket.timestamps[0] + windowMs };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: max - bucket.timestamps.length, resetAt: now + windowMs };
}

export async function ratelimit({
  key,
  max,
  windowMs,
}: {
  key: string;
  max: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (HAS_UPSTASH) {
    try {
      return await upstashSlidingWindow(key, max, windowMs);
    } catch {
      // Network blip / Upstash outage — degrade to in-memory rather than 500.
      // The in-memory budget is still better than no enforcement at all.
      return inMemorySlidingWindow(key, max, windowMs);
    }
  }
  return inMemorySlidingWindow(key, max, windowMs);
}

// Synchronous variant retained for tests + non-Edge call sites that can't
// await. Always uses the in-memory backend.
export function ratelimitSync({ key, max, windowMs }: { key: string; max: number; windowMs: number }): RateLimitResult {
  return inMemorySlidingWindow(key, max, windowMs);
}

// Edge-runtime-safe base64 → utf8. atob is available on Edge + Node.
function b64decode(input: string): string {
  // Normalize base64url → base64 and pad.
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  // Reconstruct UTF-8 from the latin-1 byte string atob returns.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Extract the Supabase user id from the auth cookie without verifying the
// signature. We only need it as a rate-limit bucket key, not as a trust claim —
// forging a JWT here just means an attacker gets rate-limited against the
// wrong bucket. Falls back to null on any parse failure.
function principalFromRequest(req: Request): string | null {
  // Supabase cookie name is `sb-<project-ref>-auth-token`, sometimes split
  // into `.0` / `.1` parts. Either the whole JSON payload is the cookie value
  // or it's prefixed with `base64-`. We only need the access_token JWT.
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((c) => c.trim());
  const authCookie = parts.find((p) => /^sb-[^=]+-auth-token(?:\.0)?=/.test(p));
  if (!authCookie) return null;
  try {
    const raw = decodeURIComponent(authCookie.split("=").slice(1).join("="));
    // Supabase stores either a JSON array `[access_token, refresh_token, ...]`
    // or (newer) a base64-encoded version prefixed with `base64-`.
    const payload = raw.startsWith("base64-") ? b64decode(raw.slice("base64-".length)) : raw;
    const parsed = JSON.parse(payload) as unknown;
    const accessToken =
      Array.isArray(parsed) && typeof parsed[0] === "string"
        ? parsed[0]
        : typeof (parsed as { access_token?: string } | null)?.access_token === "string"
          ? (parsed as { access_token: string }).access_token
          : null;
    if (!accessToken) return null;
    const [, body] = accessToken.split(".");
    if (!body) return null;
    const json = JSON.parse(b64decode(body)) as { sub?: string };
    return typeof json.sub === "string" && json.sub.length > 0 ? json.sub : null;
  } catch {
    return null;
  }
}

// Map a request to a rate-limit key. Prefers the authenticated principal
// (Supabase user id) so one bad actor on a shared NAT can't lock out
// everyone behind the same IP, and one authed user on two devices still
// shares a single budget. Falls back to IP for unauthed / pre-login traffic.
export function keyFromRequest(req: Request, prefix: string): string {
  const principal = principalFromRequest(req);
  if (principal) return `${prefix}:user:${principal}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return `${prefix}:ip:${ip}`;
}

// Budgets per endpoint family. Extend as we wire more endpoints.
export const RATE_BUDGETS = {
  auth: { max: 10, windowMs: 60_000 }, // 10 / min — login/signup/forgot
  ai: { max: 30, windowMs: 60_000 }, // 30 / min — AI chat
  scan: { max: 120, windowMs: 60_000 }, // 120 / min — field scanning is fast
  webhook: { max: 300, windowMs: 60_000 }, // Stripe delivery rate
  default: { max: 60, windowMs: 60_000 },
} as const;
