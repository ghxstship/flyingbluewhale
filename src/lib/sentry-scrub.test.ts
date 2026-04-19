/**
 * Regression tests for the Sentry PII scrubber (H2-06 / IK-041).
 */
import { describe, it, expect } from "vitest";
import { scrubString, scrubCookieHeader, scrubSentryEvent } from "./sentry-scrub";

describe("scrubString", () => {
  it("redacts UUIDs", () => {
    expect(scrubString("/api/v1/projects/498a047e-bd2a-401e-9efb-f7fb796290d4")).toBe(
      "/api/v1/projects/:uuid",
    );
  });
  it("redacts emails", () => {
    expect(scrubString("failed login for julian.clarkson@ghxstship.pro")).toBe(
      "failed login for :email",
    );
  });
  it("redacts JWT-shaped tokens", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.XXXXXXXXXXXX";
    expect(scrubString(`token=${jwt}`)).toBe("token=:jwt");
  });
  it("redacts Bearer tokens", () => {
    expect(scrubString("Authorization: Bearer sb_secret_abc12345")).toBe(
      "Authorization: Bearer [REDACTED]",
    );
  });
  it("redacts Stripe identifiers", () => {
    expect(scrubString("charging cus_NXbRioAJhXqkMn and pi_3OabcdefghIJklmnopqr")).toBe(
      "charging :stripe-id and :stripe-id",
    );
  });
  it("leaves benign strings untouched", () => {
    expect(scrubString("request completed in 42ms")).toBe("request completed in 42ms");
  });
  it("passes through null / undefined", () => {
    expect(scrubString(null)).toBe(null);
    expect(scrubString(undefined)).toBe(undefined);
  });
});

describe("scrubCookieHeader", () => {
  it("redacts Supabase auth tokens while preserving benign cookies", () => {
    const header = "fbw_consent=%7B%22essential%22%3Atrue%7D; sb-abc123-auth-token=raw.jwt.value; theme=dark";
    const out = scrubCookieHeader(header) ?? "";
    expect(out).toContain("fbw_consent=%7B%22essential%22%3Atrue%7D");
    expect(out).toContain("sb-abc123-auth-token=[REDACTED]");
    expect(out).toContain("theme=dark");
    expect(out).not.toContain("raw.jwt.value");
  });
  it("handles split-cookie .0 / .1 suffix variants", () => {
    const header = "sb-xrov-auth-token.0=part1; sb-xrov-auth-token.1=part2";
    const out = scrubCookieHeader(header) ?? "";
    expect(out).toContain("sb-xrov-auth-token.0=[REDACTED]");
    expect(out).toContain("sb-xrov-auth-token.1=[REDACTED]");
  });
});

describe("scrubSentryEvent", () => {
  it("strips PII from request.url + request.headers + exception.value", () => {
    const event = {
      request: {
        url: "https://app.example/api/v1/projects/498a047e-bd2a-401e-9efb-f7fb796290d4?email=julian@ghxstship.pro",
        headers: {
          Authorization: "Bearer sb_secret_123456",
          Cookie: "sb-abc-auth-token=leak; theme=dark",
          "X-Forwarded-For": "10.0.0.1",
        },
      },
      message: "fetch failed for julian@ghxstship.pro",
      exception: { values: [{ value: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.XXXXXXXXXXXX" }] },
    };

    scrubSentryEvent(event);

    expect(event.request.url).not.toMatch(/498a047e/);
    expect(event.request.url).toMatch(/:uuid/);
    expect(event.request.url).not.toMatch(/julian@/);
    expect(event.request.headers.Authorization).toBe("[REDACTED]");
    expect(event.request.headers.Cookie).toContain("sb-abc-auth-token=[REDACTED]");
    expect(event.request.headers.Cookie).toContain("theme=dark");
    expect(event.message).not.toMatch(/julian@/);
    expect(event.exception.values[0].value).not.toMatch(/eyJhbGci/);
  });

  it("is a no-op for events without request / exception fields", () => {
    const event = { message: "generic warning" };
    scrubSentryEvent(event);
    expect(event.message).toBe("generic warning");
  });
});
