import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeWebhook } from "./stripe";

/**
 * Pins the hand-rolled Stripe webhook HMAC verification — this 60-line
 * function is the only thing standing between the public internet and
 * invoice/subscription mutations, and its e2e specs skip in CI when
 * STRIPE_WEBHOOK_SECRET is unset.
 */

const SECRET = "whsec_test_secret";
const EVENT = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded", data: { object: { id: "pi_1" } } });

function sign(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

describe("verifyStripeWebhook", () => {
  it("accepts a correctly signed payload", async () => {
    const result = await verifyStripeWebhook(EVENT, sign(EVENT, SECRET), SECRET);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("payment_intent.succeeded");
    expect(result?.id).toBe("evt_1");
  });

  it("rejects a signature minted with the wrong secret", async () => {
    expect(await verifyStripeWebhook(EVENT, sign(EVENT, "whsec_wrong"), SECRET)).toBeNull();
  });

  it("rejects a tampered body", async () => {
    const header = sign(EVENT, SECRET);
    const tampered = EVENT.replace("pi_1", "pi_evil");
    expect(await verifyStripeWebhook(tampered, header, SECRET)).toBeNull();
  });

  it("rejects a stale timestamp outside the tolerance window", async () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(await verifyStripeWebhook(EVENT, sign(EVENT, SECRET, old), SECRET)).toBeNull();
  });

  it("accepts a timestamp inside a widened tolerance", async () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(await verifyStripeWebhook(EVENT, sign(EVENT, SECRET, old), SECRET, 7200)).not.toBeNull();
  });

  it("rejects missing header or secret", async () => {
    expect(await verifyStripeWebhook(EVENT, null, SECRET)).toBeNull();
    expect(await verifyStripeWebhook(EVENT, sign(EVENT, SECRET), undefined)).toBeNull();
  });

  it("rejects malformed signature headers", async () => {
    expect(await verifyStripeWebhook(EVENT, "v1=deadbeef", SECRET)).toBeNull();
    expect(await verifyStripeWebhook(EVENT, "t=123", SECRET)).toBeNull();
    expect(await verifyStripeWebhook(EVENT, "garbage", SECRET)).toBeNull();
  });

  it("rejects a signature of the wrong length without throwing", async () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(await verifyStripeWebhook(EVENT, `t=${ts},v1=abc`, SECRET)).toBeNull();
  });
});
