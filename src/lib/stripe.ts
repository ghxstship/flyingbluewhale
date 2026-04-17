import "server-only";
import { env } from "./env";

export const hasStripe = Boolean(env.STRIPE_SECRET_KEY);

/**
 * Verify a Stripe webhook signature.
 * We implement the v1 scheme (HMAC-SHA256 of `timestamp.payload`) directly so we
 * don't need to pull in the full `stripe` SDK for webhook verification alone.
 * Tolerance defaults to 5 minutes.
 *
 * Returns the parsed JSON event on success, `null` on invalid signature.
 */
export async function verifyStripeWebhook(
  rawBody: string,
  sigHeader: string | null,
  secret: string | undefined,
  toleranceSec = 300,
): Promise<null | { type: string; data: { object: unknown }; id: string }> {
  if (!sigHeader || !secret) return null;

  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return null;

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (Number.isNaN(ageSec) || ageSec > toleranceSec) return null;

  const payload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (hex !== signature) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
