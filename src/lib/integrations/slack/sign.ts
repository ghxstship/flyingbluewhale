/**
 * Slack request signature verification + state HMAC for OAuth CSRF.
 *
 * Slack signs every event-subscription POST with `v0=<hmac>`, where the
 * MAC is HMAC-SHA256 over `v0:<timestamp>:<rawBody>` keyed by the app's
 * Signing Secret. We re-implement directly so we don't pull the Bolt SDK
 * just for verification.
 *
 * Tolerance: 5 minutes (Slack docs recommendation). Replays older than
 * that are rejected even with a valid MAC.
 *
 * Also exports a small HMAC for OAuth state CSRF — a signed `{orgId, nonce}`
 * passed as `&state=...` so the callback handler can prove the request
 * originated from us.
 *
 * NOTE: kept Node-stdlib-free at the public surface so this module can run
 * in Edge runtimes if we ever move the events endpoint there.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SEC = 60 * 5;

/**
 * Verify a Slack request signature.
 *
 * @param signingSecret  SLACK_SIGNING_SECRET from env.
 * @param signature      X-Slack-Signature header (`v0=<hex>` form).
 * @param timestamp      X-Slack-Request-Timestamp header (unix seconds).
 * @param rawBody        Exact request body string — must NOT be re-stringified.
 * @param now            Optional clock override (for tests).
 */
export function verifySlackSignature(opts: {
  signingSecret: string;
  signature: string | null;
  timestamp: string | null;
  rawBody: string;
  now?: number;
}): boolean {
  const { signingSecret, signature, timestamp, rawBody } = opts;
  if (!signingSecret || !signature || !timestamp) return false;

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return false;

  const nowSec = Math.floor((opts.now ?? Date.now()) / 1000);
  if (Math.abs(nowSec - tsNum) > TOLERANCE_SEC) return false;

  if (!signature.startsWith("v0=")) return false;
  const provided = signature.slice(3);

  const base = `v0:${timestamp}:${rawBody}`;
  const mac = createHmac("sha256", signingSecret).update(base).digest("hex");

  if (mac.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

/**
 * Sign a CSRF state value for the OAuth install redirect.
 * Format: `<base64url(payload)>.<base64url(hex sig)>` where payload is
 * `<orgId>.<nonce>.<expMs>`.
 */
export function signOAuthState(opts: {
  secret: string;
  orgId: string;
  nonce?: string;
  ttlMs?: number;
  now?: number;
}): string {
  const now = opts.now ?? Date.now();
  const exp = now + (opts.ttlMs ?? 10 * 60 * 1000);
  const nonce = opts.nonce ?? cryptoRandomNonce();
  const payload = `${opts.orgId}.${nonce}.${exp}`;
  const sig = createHmac("sha256", opts.secret).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/**
 * Verify a state token. Returns `{ orgId, nonce }` on success, null otherwise.
 */
export function verifyOAuthState(opts: {
  secret: string;
  state: string;
  now?: number;
}): { orgId: string; nonce: string } | null {
  const { secret, state } = opts;
  if (typeof state !== "string" || state.length === 0) return null;
  const parts = state.split(".");
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
  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return null;
  }
  if (!ok) return null;

  const segs = payload.split(".");
  if (segs.length !== 3) return null;
  const [orgId, nonce, expStr] = segs;
  if (!orgId || !nonce || !expStr) return null;

  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return null;
  const now = opts.now ?? Date.now();
  if (now > exp) return null;

  return { orgId, nonce };
}

function cryptoRandomNonce(): string {
  // 16 bytes hex = 32 chars. Plenty for a CSRF nonce.
  const arr = new Uint8Array(16);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
