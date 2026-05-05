import { describe, it, expect, beforeAll } from "vitest";

// Set the secret BEFORE importing the module so it picks it up at first call.
beforeAll(() => {
  process.env.SHARE_LINK_SECRET = "test-secret-for-vitest-only";
});

import { signShareToken, verifyShareToken } from "../share/tokens";

describe("signShareToken / verifyShareToken", () => {
  it("round-trips a token", () => {
    const t = signShareToken({ id: "abc-123" });
    const verified = verifyShareToken(t);
    expect(verified?.id).toBe("abc-123");
    expect(verified?.expiresAt).toBeNull();
    expect(typeof verified?.nonce).toBe("string");
  });

  it("returns null on tampered signature", () => {
    const t = signShareToken({ id: "abc-123" });
    const [payload, sig] = t.split(".");
    // Flip one base64url char in the signature, preserving length so the
    // length-pre-check in the verifier passes and we exercise timingSafeEqual.
    const swap = sig[0] === "A" ? "B" : "A";
    const tampered = `${payload}.${swap}${sig.slice(1)}`;
    expect(verifyShareToken(tampered)).toBeNull();
  });

  it("returns null on tampered payload", () => {
    const t = signShareToken({ id: "abc-123" });
    const [, sig] = t.split(".");
    const fakePayload = Buffer.from("zzz-999..deadbeef", "utf8").toString("base64url");
    expect(verifyShareToken(`${fakePayload}.${sig}`)).toBeNull();
  });

  it("returns null on missing dot separator", () => {
    expect(verifyShareToken("notavalidtoken")).toBeNull();
  });

  it("returns null on empty string", () => {
    expect(verifyShareToken("")).toBeNull();
  });

  it("expires past tokens", () => {
    const t = signShareToken({ id: "x", expiresAt: new Date(Date.now() - 1000) });
    expect(verifyShareToken(t)).toBeNull();
  });

  it("accepts not-yet-expired tokens", () => {
    const future = new Date(Date.now() + 60_000);
    const t = signShareToken({ id: "x", expiresAt: future });
    const v = verifyShareToken(t);
    expect(v?.id).toBe("x");
    expect(v?.expiresAt?.getTime()).toBe(future.getTime());
  });

  it("encodes/decodes UUIDs in id", () => {
    const uuid = "0e8b9c1d-2f3a-4b5c-6d7e-8f9a0b1c2d3e";
    const t = signShareToken({ id: uuid });
    expect(verifyShareToken(t)?.id).toBe(uuid);
  });

  it("uses different sig for different ids", () => {
    const a = signShareToken({ id: "id-one" });
    const b = signShareToken({ id: "id-two" });
    const sigA = a.split(".")[1];
    const sigB = b.split(".")[1];
    expect(sigA).not.toBe(sigB);
  });

  it("uses different nonce on each sign even with same id", () => {
    const a = signShareToken({ id: "same" });
    const b = signShareToken({ id: "same" });
    // Different nonce => different signature; tokens must not collide.
    expect(a).not.toBe(b);
  });

  it("rejects token signed with a different secret", () => {
    const t = signShareToken({ id: "abc" });
    process.env.SHARE_LINK_SECRET = "rotated-secret-now";
    try {
      expect(verifyShareToken(t)).toBeNull();
    } finally {
      process.env.SHARE_LINK_SECRET = "test-secret-for-vitest-only";
    }
  });
});
