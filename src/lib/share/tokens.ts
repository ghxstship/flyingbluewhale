import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * HMAC-SHA256 token signer / verifier for share_links.
 *
 * Design:
 *  - Token = `${base64url(payload)}.${sig}` where payload = `${id}.${expMs}.${nonce}`.
 *  - The URL never carries the secret; the secret stays in env (`SHARE_LINK_SECRET`).
 *  - Verification is constant-time on the signature, then re-checks expiry on
 *    the decoded payload so a stale-but-signed token is still rejected.
 *
 * Secret rotation: bumping `SHARE_LINK_SECRET` invalidates every outstanding
 * token in one move (which is the whole point — the DB row stays, but the
 * token is no longer verifiable). To soften that, an env-driven keyring
 * could be layered later; the verifier already returns null on mismatch so
 * adding a second key is a one-line change.
 */

/**
 * Returns the secret bytes, or null when SHARE_LINK_SECRET isn't configured.
 * Sign callers throw on null (creating a token without a secret is a bug).
 * Verify callers treat null as "no token can possibly be valid" (return null).
 */
function getSecret(): Buffer | null {
  const SECRET = process.env.SHARE_LINK_SECRET;
  if (!SECRET) return null;
  return Buffer.from(SECRET, "utf8");
}

export function signShareToken(opts: { id: string; expiresAt?: Date }): string {
  const secret = getSecret();
  if (!secret) throw new Error("SHARE_LINK_SECRET env var not set — cannot sign share tokens");
  const nonce = randomBytes(8).toString("hex");
  const exp = opts.expiresAt?.getTime().toString() ?? "";
  const payload = `${opts.id}.${exp}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyShareToken(token: string): { id: string; expiresAt: Date | null; nonce: string } | null {
  if (typeof token !== "string" || token.length === 0) return null;
  const secret = getSecret();
  if (!secret) return null; // env not configured → no token can verify; route renders "not valid"
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  // timingSafeEqual requires equal-length buffers; we already checked.
  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return null;
  }
  if (!ok) return null;

  const segs = payload.split(".");
  if (segs.length !== 3) return null;
  const [id, expStr, nonce] = segs;
  if (!id) return null;

  let expiresAt: Date | null = null;
  if (expStr) {
    const ms = parseInt(expStr, 10);
    if (!Number.isFinite(ms)) return null;
    expiresAt = new Date(ms);
    if (expiresAt.getTime() < Date.now()) return null;
  }

  return { id, expiresAt, nonce };
}
