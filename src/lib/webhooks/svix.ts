import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Svix webhook signature verification (the scheme Resend uses for its
 * outbound-events webhooks — https://docs.svix.com/receiving/verifying-payloads).
 *
 * The signed content is `${svix_id}.${svix_timestamp}.${body}`, HMAC-SHA256
 * keyed with the base64-decoded secret (the part after the `whsec_` prefix).
 * The `svix-signature` header carries space-separated `v<n>,<base64 sig>`
 * entries (multiple during secret rotation); any matching `v1` entry passes.
 *
 * Pure function (no env reads) so it unit-tests without a request context.
 */

/** Default tolerance: reject events older/newer than 5 minutes. */
export const SVIX_TOLERANCE_SECONDS = 5 * 60;

export function verifySvixSignature(input: {
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  body: string;
  /** Injectable clock (ms since epoch) for tests. Defaults to Date.now(). */
  nowMs?: number;
  toleranceSeconds?: number;
}): boolean {
  const { secret, svixId, svixTimestamp, svixSignature, body } = input;
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  // Timestamp freshness — bounds replay of a captured payload.
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = (input.nowMs ?? Date.now()) / 1000;
  const tolerance = input.toleranceSeconds ?? SVIX_TOLERANCE_SECONDS;
  if (Math.abs(nowSec - ts) > tolerance) return false;

  // Key = base64 decode of the secret after the `whsec_` prefix.
  const rawSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key).update(`${svixId}.${svixTimestamp}.${body}`).digest();

  // Header format: "v1,<sig> v1,<sig> ..." — accept any matching v1 entry.
  for (const entry of svixSignature.split(" ")) {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) continue;
    let candidate: Buffer;
    try {
      candidate = Buffer.from(sig, "base64");
    } catch {
      continue;
    }
    // timingSafeEqual throws on length mismatch — guard first (length is
    // not secret; the digest length is fixed at 32 bytes anyway).
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
      return true;
    }
  }
  return false;
}
