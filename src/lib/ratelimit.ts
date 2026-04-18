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
    const payload = raw.startsWith("base64-")
      ? b64decode(raw.slice("base64-".length))
      : raw;
    const parsed = JSON.parse(payload) as unknown;
    const accessToken = Array.isArray(parsed) && typeof parsed[0] === "string"
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
  auth:     { max: 10,  windowMs: 60_000 },   // 10 / min — login/signup/forgot
  ai:       { max: 30,  windowMs: 60_000 },   // 30 / min — AI chat
  scan:     { max: 120, windowMs: 60_000 },   // 120 / min — field scanning is fast
  webhook:  { max: 300, windowMs: 60_000 },   // Stripe delivery rate
  default:  { max: 60,  windowMs: 60_000 },
} as const;
