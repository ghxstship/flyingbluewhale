import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySvixSignature, SVIX_TOLERANCE_SECONDS } from "./svix";

// Fixture: a known secret + a deterministic clock.
const RAW_KEY = Buffer.from("test-webhook-secret-key-material");
const SECRET = `whsec_${RAW_KEY.toString("base64")}`;
const NOW_MS = 1_753_351_200_000; // 2026-07-24T10:00:00Z
const NOW_SEC = Math.floor(NOW_MS / 1000);

function sign(id: string, timestamp: string, body: string, key: Buffer = RAW_KEY): string {
  const digest = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return `v1,${digest}`;
}

describe("verifySvixSignature", () => {
  const body = JSON.stringify({ type: "email.opened", data: { email_id: "re_123" } });
  const svixId = "msg_2abc";
  const svixTimestamp = String(NOW_SEC);

  it("accepts a valid signature", () => {
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp,
        svixSignature: sign(svixId, svixTimestamp, body),
        body,
        nowMs: NOW_MS,
      }),
    ).toBe(true);
  });

  it("accepts when the valid entry is among multiple space-separated signatures", () => {
    const sig = `v1,${Buffer.alloc(32).toString("base64")} ${sign(svixId, svixTimestamp, body)}`;
    expect(
      verifySvixSignature({ secret: SECRET, svixId, svixTimestamp, svixSignature: sig, body, nowMs: NOW_MS }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = body.replace("re_123", "re_456");
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp,
        svixSignature: sign(svixId, svixTimestamp, body),
        body: tampered,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });

  it("rejects a signature made with the wrong key", () => {
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp,
        svixSignature: sign(svixId, svixTimestamp, body, Buffer.from("some-other-key")),
        body,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });

  it("rejects a stale timestamp (older than the tolerance)", () => {
    const stale = String(NOW_SEC - SVIX_TOLERANCE_SECONDS - 1);
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp: stale,
        svixSignature: sign(svixId, stale, body),
        body,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });

  it("rejects a future timestamp beyond the tolerance", () => {
    const future = String(NOW_SEC + SVIX_TOLERANCE_SECONDS + 1);
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp: future,
        svixSignature: sign(svixId, future, body),
        body,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });

  it("rejects missing headers and non-v1 entries", () => {
    expect(
      verifySvixSignature({ secret: SECRET, svixId: "", svixTimestamp, svixSignature: sign(svixId, svixTimestamp, body), body, nowMs: NOW_MS }),
    ).toBe(false);
    expect(
      verifySvixSignature({
        secret: SECRET,
        svixId,
        svixTimestamp,
        svixSignature: sign(svixId, svixTimestamp, body).replace("v1,", "v2,"),
        body,
        nowMs: NOW_MS,
      }),
    ).toBe(false);
  });
});
