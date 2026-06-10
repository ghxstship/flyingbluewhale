/**
 * SSRF guard for outbound fetches against user-supplied URLs.
 *
 * The codebase's `webhook.send` automation action accepts arbitrary
 * URLs from automation authors. Without this guard, an automation
 * could be crafted to POST to internal addresses:
 *   - http://169.254.169.254/latest/meta-data/   (AWS instance metadata)
 *   - http://localhost:5432                       (local Postgres)
 *   - http://10.0.0.1/admin                       (internal RFC1918)
 *   - file:///etc/passwd                          (file URI)
 *
 * `validateOutboundUrl(url)` rejects non-http(s) schemes and any URL
 * whose hostname (or, for hostnames, any of its DNS A/AAAA records)
 * resolves to a private / loopback / link-local address.
 *
 * Defense-in-depth notes:
 *   - DNS resolution happens at validation time. A pinned-DNS attack
 *     could in principle pass validation then re-resolve to a
 *     private IP at connect time. Mitigation requires connecting via
 *     the resolved IP and preserving the Host header — out of scope
 *     for this guard, but the failure mode is mostly defeated by
 *     the per-host circuit breaker in http.ts (an attacker who got
 *     past validation can only land 5 requests before the breaker
 *     trips).
 *   - This guard is intentionally synchronous-after-DNS so the
 *     caller awaits both. Don't bypass it for "performance."
 */

import "server-only";
import { promises as dns } from "node:dns";
import { isIPv4, isIPv6 } from "node:net";

export type SsrfValidation = { ok: true; resolved: string[] } | { ok: false; reason: string };

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns true if the given IP literal sits in a private / loopback /
 * link-local / multicast / reserved range that an outbound fetch
 * should never be allowed to reach.
 */
export function isBlockedIp(ip: string): boolean {
  if (!ip) return true;
  if (isIPv4(ip)) {
    const [a = Number.NaN, b = Number.NaN] = ip.split(".").map((n) => Number.parseInt(n, 10));
    if (Number.isNaN(a) || Number.isNaN(b)) return true;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10/8 RFC1918
    if (a === 127) return true; // 127/8 loopback
    if (a === 169 && b === 254) return true; // 169.254/16 link-local (incl AWS metadata)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 RFC1918
    if (a === 192 && b === 168) return true; // 192.168/16 RFC1918
    if (a === 192 && b === 0) return true; // 192.0/24 documentation / IETF reserved
    if (a === 192 && b === 88) return true; // 192.88.99/24 6to4 reserved
    if (a >= 224) return true; // 224/4 multicast + 240/4 reserved + 255 broadcast
    return false;
  }
  if (isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true; // unspecified + loopback
    if (lower.startsWith("fe80:") || lower.startsWith("fe80::")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
    if (lower.startsWith("ff")) return true; // multicast ff00::/8
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped — recurse on the embedded v4 octets.
      const v4 = lower.slice("::ffff:".length);
      return isBlockedIp(v4);
    }
    return false;
  }
  // Anything that isn't a valid IP literal is treated as suspicious.
  return true;
}

/**
 * Validate a URL for outbound fetch safety. Resolves the hostname's
 * A and AAAA records and rejects if ANY resolved address is in a
 * blocked range, mitigating naive SSRF without protecting against
 * DNS rebinding (see file header).
 */
export async function validateOutboundUrl(input: string | URL): Promise<SsrfValidation> {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : input;
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `Protocol ${url.protocol} not allowed (only http, https)` };
  }
  const host = url.hostname;
  if (!host) return { ok: false, reason: "Missing hostname" };

  // Direct IP literal — validate without DNS.
  if (isIPv4(host) || isIPv6(host)) {
    if (isBlockedIp(host)) {
      return { ok: false, reason: `Blocked IP ${host}` };
    }
    return { ok: true, resolved: [host] };
  }

  // Hostname — resolve A + AAAA. If any record is blocked, reject.
  let v4: string[] = [];
  let v6: string[] = [];
  try {
    v4 = await dns.resolve4(host).catch(() => []);
  } catch {
    /* fall through */
  }
  try {
    v6 = await dns.resolve6(host).catch(() => []);
  } catch {
    /* fall through */
  }
  const resolved = [...v4, ...v6];
  if (resolved.length === 0) {
    return { ok: false, reason: `DNS resolution failed for ${host}` };
  }
  for (const ip of resolved) {
    if (isBlockedIp(ip)) {
      return { ok: false, reason: `Hostname ${host} resolves to blocked IP ${ip}` };
    }
  }
  return { ok: true, resolved };
}
