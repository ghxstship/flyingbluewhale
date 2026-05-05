import "server-only";

/**
 * VAPID configuration for Web Push (Phase 2.3).
 *
 * Keys are generated once per environment and stored in env vars. Generate
 * locally with `npx web-push generate-vapid-keys` and put the public/private
 * pair plus a `mailto:` subject in the deployment env.
 */

export type VapidConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

let cached: VapidConfig | null = null;

/**
 * Returns the VAPID config or throws if any of the three required env vars
 * is missing. Callers should let the error propagate — it indicates a
 * misconfigured environment, not a runtime user error.
 */
export function vapid(): VapidConfig {
  if (cached) return cached;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID is not configured. Set VAPID_SUBJECT (mailto:), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.");
  }
  cached = { subject, publicKey, privateKey };
  return cached;
}

/** True iff every VAPID env var is set; lets callers no-op gracefully. */
export function hasVapid(): boolean {
  return Boolean(process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
