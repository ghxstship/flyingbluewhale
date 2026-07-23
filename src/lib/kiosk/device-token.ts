import { createHash, randomBytes } from "node:crypto";

/**
 * T1-4 kiosk mode — device token mint / hash.
 *
 * A kiosk device's ONLY credential is a long-lived random token minted when a
 * manager registers the tablet from their own session. The raw token lives in
 * the tablet's httpOnly cookie; the DB stores only the SHA-256 hex
 * (`kiosk_devices.device_token_hash`). 32 bytes of entropy makes the token
 * unguessable, so plain hash-equality lookup (indexed, O(1)) is sound — no
 * salt/stretching needed for a 256-bit random secret.
 *
 * Pure/env-free module so vitest exercises the production code paths.
 */

/** Cookie carrying the raw device token on the kiosk tablet. */
export const KIOSK_DEVICE_COOKIE = "atlvs-kiosk-device";

/** Cookie lifetime — effectively "until revoked" (browser cap is 400 days). */
export const KIOSK_DEVICE_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60;

const TOKEN_PREFIX = "kd_";
const TOKEN_BYTES = 32;

/** Mint a raw device token: `kd_` + 32 random bytes, base64url. */
export function generateDeviceToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString("base64url")}`;
}

/** SHA-256 hex of the raw token — the at-rest form. */
export function hashDeviceToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Cheap shape check before hitting the DB. Not a security boundary (the
 * hash lookup is); it just keeps junk cookies from costing a query.
 */
export function isPlausibleDeviceToken(raw: string | undefined | null): raw is string {
  return typeof raw === "string" && raw.startsWith(TOKEN_PREFIX) && raw.length >= 20 && raw.length <= 200;
}
