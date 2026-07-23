import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * T1-4 kiosk mode — worker punch-PIN hashing and lookup digests.
 *
 * Two derived values per PIN, with different jobs:
 *
 *  - `hashPin` → scrypt (N=16384, r=8, p=1, 16-byte salt). The verification
 *    hash stored in `kiosk_worker_pins.pin_hash`. Memory-hard, per-row salt.
 *  - `pinLookupDigest` → HMAC-SHA256(`${orgId}:${pin}`, server pepper). The
 *    deterministic O(1) lookup key: kiosk PIN entry can't know WHICH worker
 *    typed, so without this every entry would be an org-wide scrypt scan.
 *    The pepper stays in env (`KIOSK_PIN_SECRET`) — a leaked table alone
 *    cannot be brute-forced offline.
 *
 * Honest threat model: a 4-6 digit PIN has ≤10^6 states; no hash makes that
 * strong. Real protection = device-scoped rate limiting (lockout.ts) + the
 * env pepper + org-scoped uniqueness. scrypt is belt-and-braces for the case
 * where DB AND env both leak.
 *
 * Secrets are passed IN as arguments — this module stays pure/env-free so
 * vitest exercises the exact production code paths.
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;

/** 4-6 digits, nothing else. */
export const KIOSK_PIN_RE = /^\d{4,6}$/;

/**
 * PINs any gate-crasher tries first. Sequences and repeats are caught
 * structurally below; these are the culturally-famous leftovers.
 */
const WEAK_PINS = new Set(["2580", "0852", "1122", "1212", "6969", "1004", "2000", "112233", "121212", "159753"]);

export type PinValidation = { ok: true } | { ok: false; reason: "format" | "weak" };

/** Structural weakness: all-same digits, or a strict asc/desc run (incl. wrap-free). */
function isStructurallyWeak(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true; // 0000, 111111
  let asc = true;
  let desc = true;
  for (let i = 1; i < pin.length; i++) {
    const prev = pin.charCodeAt(i - 1);
    const cur = pin.charCodeAt(i);
    if (cur !== prev + 1) asc = false;
    if (cur !== prev - 1) desc = false;
  }
  return asc || desc; // 1234, 4321, 0123, 9876
}

export function validatePin(pin: string): PinValidation {
  if (!KIOSK_PIN_RE.test(pin)) return { ok: false, reason: "format" };
  if (isStructurallyWeak(pin) || WEAK_PINS.has(pin)) return { ok: false, reason: "weak" };
  return { ok: true };
}

/** scrypt-hash a PIN → `scrypt:N:r:p:saltB64url:hashB64url`. */
export function hashPin(pin: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(pin, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join(":");
}

/** Constant-time verify against a `hashPin` string. Malformed stored → false. */
export function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  try {
    const salt = Buffer.from(saltB64 as string, "base64url");
    const expected = Buffer.from(hashB64 as string, "base64url");
    if (salt.length === 0 || expected.length === 0) return false;
    const derived = scryptSync(pin, salt, expected.length, { N, r, p });
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Deterministic org-scoped lookup digest (hex). Same (org, pin, secret) →
 * same digest, which is what makes the partial unique index enforce
 * org-scoped PIN uniqueness for free.
 */
export function pinLookupDigest(orgId: string, pin: string, secret: string): string {
  if (!secret) throw new Error("pinLookupDigest requires a non-empty secret");
  return createHmac("sha256", secret).update(`${orgId}:${pin}`).digest("hex");
}
