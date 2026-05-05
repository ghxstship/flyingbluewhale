// ────────────────────────────────────────────────────────────────────
// IP allowlist — pure logic, runs in both Edge (proxy.ts) and Node.
//
// We hand-roll IPv4 CIDR matching (no external deps). IPv6 is not yet
// supported here — most enterprise allowlists are IPv4-only and the
// `cidr` Postgres column accepts both, so once we move CIDR matching
// server-side via the `<<=` operator we'll get v6 for free.
//
// Matching rules:
//   - Empty allowlist → allowed (opt-in feature)
//   - IPv4 CIDR: x.x.x.x/N — bitmask compare
//   - Single IPv4 (no slash): treated as /32
//   - IPv6 entries are silently ignored in the app-layer matcher; the DB
//     is still source-of-truth so admins can store v6 ranges and have
//     them enforced once we plumb the DB-side matcher in.
// ────────────────────────────────────────────────────────────────────

export type CidrRange = {
  raw: string;
  family: 4 | 6;
  /** IPv4: 32-bit network address as unsigned int. */
  network?: number;
  /** IPv4: prefix length 0..32 */
  prefix?: number;
};

const IPV4_RX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Parse an IPv4 dotted-quad to a 32-bit unsigned int. Returns null on malformed input. */
export function ipv4ToInt(ip: string): number | null {
  const m = ip.trim().match(IPV4_RX);
  if (!m) return null;
  const [, a, b, c, d] = m;
  const oct = [a, b, c, d].map((s) => Number.parseInt(s, 10));
  if (oct.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  // Use unsigned 32-bit math: shift produces a signed int in JS.
  return ((oct[0] << 24) | (oct[1] << 16) | (oct[2] << 8) | oct[3]) >>> 0;
}

/**
 * Parse a CIDR or single IP. Returns a normalized range, or null on malformed
 * input. IPv6 entries are flagged with `family: 6` but `network`/`prefix` are
 * left undefined (we don't currently match v6 in-process).
 */
export function parseIpRange(input: string): CidrRange | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.includes(":")) {
    return { raw, family: 6 };
  }
  const [addr, prefixRaw] = raw.split("/");
  const network = ipv4ToInt(addr);
  if (network === null) return null;
  let prefix: number;
  if (prefixRaw === undefined) {
    prefix = 32;
  } else {
    const n = Number.parseInt(prefixRaw, 10);
    if (!Number.isInteger(n) || n < 0 || n > 32) return null;
    prefix = n;
  }
  // Mask the network address so e.g. 10.0.0.5/24 normalizes to 10.0.0.0/24.
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return { raw, family: 4, network: (network & mask) >>> 0, prefix };
}

/**
 * Test whether `ip` (IPv4 dotted-quad) falls inside `cidr` ("a.b.c.d/N" or
 * "a.b.c.d"). Returns false on any parse error — fail-closed.
 */
export function ipv4InCidr(ip: string, cidr: string): boolean {
  const range = parseIpRange(cidr);
  if (!range || range.family !== 4 || range.network === undefined || range.prefix === undefined) {
    return false;
  }
  const target = ipv4ToInt(ip);
  if (target === null) return false;
  if (range.prefix === 0) return true;
  const mask = (~0 << (32 - range.prefix)) >>> 0;
  return (target & mask) >>> 0 === range.network;
}

/**
 * Extract the originating client IP from a Next.js request. Vercel sets
 * `x-forwarded-for: <client>, <proxy>, <proxy>` — we take the first hop.
 * Falls back to `x-real-ip` and finally null.
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

/**
 * Server-side check against `org_ip_allowlist`. Empty allowlist ⇒ allowed
 * (opt-in feature). On any DB error we fail-OPEN — locking out an org due to
 * a transient outage is worse than leaving the gate temporarily relaxed.
 */
export async function isIpAllowed(orgId: string, ip: string | null): Promise<boolean> {
  if (!ip) return true; // can't determine — don't lock out
  // Lazy import so this module remains importable from edge runtime test
  // contexts. The proxy uses a different Supabase client instantiation.
  const { createServiceClient, isServiceClientAvailable } = await import("@/lib/supabase/server");
  if (!isServiceClientAvailable()) return true;
  const admin = createServiceClient();
  const { data, error } = await admin.from("org_ip_allowlist").select("cidr").eq("org_id", orgId).eq("enabled", true);
  if (error) return true; // fail-open on infrastructure error
  const ranges = (data ?? []) as Array<{ cidr: string }>;
  if (ranges.length === 0) return true; // opt-in: empty = no enforcement
  for (const r of ranges) {
    if (ipv4InCidr(ip, r.cidr)) return true;
  }
  return false;
}
