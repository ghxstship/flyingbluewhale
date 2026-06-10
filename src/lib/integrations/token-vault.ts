import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Token vault — at-rest encryption for third-party OAuth tokens stored in
 * `accounting_connections.auth_ciphertext` (and any future integration
 * credential column).
 *
 * Format (v1): `v1.<base64url iv>.<base64url tag>.<base64url ciphertext>`
 * AES-256-GCM keyed from INTEGRATION_TOKEN_KEY (base64, exactly 32 bytes).
 * Generate one with: `openssl rand -base64 32`.
 *
 * Back-compat: rows written before 2026-06 stored bare base64(JSON) with
 * `auth_key_ref = "env_base64_placeholder"`. `openTokens` transparently
 * reads both formats, and callers re-seal on the next token refresh, so
 * the fleet migrates itself without a data migration.
 *
 * Production posture: sealing REFUSES to fall back to plaintext — a
 * missing key throws rather than silently storing live refresh tokens
 * base64-encoded. Dev keeps the base64 fallback so local setups without
 * the key still work.
 */

const KEY_ENV = "INTEGRATION_TOKEN_KEY";
export const VAULT_KEY_REF = `env:${KEY_ENV}`;
export const LEGACY_KEY_REF = "env_base64_placeholder";

function loadKey(): Buffer | null {
  const raw = process.env[KEY_ENV];
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${KEY_ENV} must be exactly 32 bytes of base64 (openssl rand -base64 32)`);
  }
  return key;
}

export function isTokenVaultConfigured(): boolean {
  return !!process.env[KEY_ENV];
}

/** Encrypt a token payload for storage. Returns the ciphertext + key ref to persist. */
export function sealTokens(payload: unknown): { ciphertext: string; keyRef: string } {
  const key = loadKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${KEY_ENV} is not configured — refusing to store integration tokens unencrypted.`);
    }
    // Dev-only plaintext fallback (legacy format) so local setups work.
    return {
      ciphertext: Buffer.from(JSON.stringify(payload)).toString("base64"),
      keyRef: LEGACY_KEY_REF,
    };
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ct.toString("base64url")}`,
    keyRef: VAULT_KEY_REF,
  };
}

/**
 * Decrypt a stored token payload. Accepts both the v1 AES-GCM format and
 * the legacy bare-base64 format. Returns null on any decode/auth failure
 * (callers surface a generic "could not decode connection tokens").
 */
export function openTokens<T>(ciphertext: string): T | null {
  if (ciphertext.startsWith("v1.")) {
    const key = loadKey();
    if (!key) return null;
    const segs = ciphertext.split(".");
    if (segs.length !== 4) return null;
    try {
      const iv = Buffer.from(segs[1]!, "base64url");
      const tag = Buffer.from(segs[2]!, "base64url");
      const ct = Buffer.from(segs[3]!, "base64url");
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
      return JSON.parse(plain) as T;
    } catch {
      return null;
    }
  }
  // Legacy bare base64(JSON).
  try {
    return JSON.parse(Buffer.from(ciphertext, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
}
