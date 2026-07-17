import { describe, expect, it } from "vitest";
import { formatsForMode, isOutOfScopeForMode, needsConfirmation, SCAN_FORMATS, SCAN_MODES } from "./formats";

/**
 * Guards the per-mode symbology contract
 * (docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §1.3).
 */

describe("formatsForMode", () => {
  it("returns a non-empty set for every mode", () => {
    for (const mode of SCAN_MODES) {
      expect(formatsForMode(mode).length).toBeGreaterThan(0);
    }
  });

  it("defaults to the full union", () => {
    expect(formatsForMode()).toEqual(SCAN_FORMATS.any);
  });

  it("keeps the pre-existing pair in every mode — no surface regresses", () => {
    // Every surface decoded qr_code + code_128 before the widening. Whatever
    // else changes, none may lose them.
    for (const mode of SCAN_MODES) {
      expect(formatsForMode(mode)).toContain("qr_code");
      expect(formatsForMode(mode)).toContain("code_128");
    }
  });

  it("access carries ticketing/credential 2D and NO retail 1D", () => {
    const access = formatsForMode("access");
    expect(access).toContain("pdf417");
    expect(access).toContain("aztec");
    expect(access).not.toContain("ean_13");
    expect(access).not.toContain("upc_a");
    expect(access).not.toContain("itf");
  });

  it("pos carries the retail set", () => {
    const pos = formatsForMode("pos");
    for (const f of ["ean_13", "ean_8", "upc_a", "upc_e", "itf"]) {
      expect(pos).toContain(f);
    }
  });

  it("confines itf to pos, where a GTIN check digit validates it", () => {
    // ITF is continuous and checksum-less at the symbology level: a partial
    // scan decodes as a shorter VALID code. It is only safe where the payload
    // is a GTIN we can verify.
    expect(formatsForMode("access")).not.toContain("itf");
    expect(formatsForMode("asset")).not.toContain("itf");
    expect(formatsForMode("pos")).toContain("itf");
  });

  it("any is the union of the scoped modes", () => {
    const any = new Set(formatsForMode("any"));
    for (const mode of ["access", "asset", "pos"] as const) {
      for (const f of formatsForMode(mode)) expect(any.has(f)).toBe(true);
    }
  });
});

describe("needsConfirmation", () => {
  it("requires N-of-M for checksum-less 1D", () => {
    expect(needsConfirmation("itf")).toBe(true);
    expect(needsConfirmation("code_39")).toBe(true);
    expect(needsConfirmation("codabar")).toBe(true);
  });

  it("does not slow down 2D or checksum-bearing formats", () => {
    for (const f of ["qr_code", "pdf417", "aztec", "data_matrix", "ean_13", "upc_a", "code_128"]) {
      expect(needsConfirmation(f)).toBe(false);
    }
    expect(needsConfirmation(undefined)).toBe(false);
  });
});

describe("isOutOfScopeForMode — the turnstile rule", () => {
  it("rejects every retail symbology on an access surface", () => {
    for (const f of ["ean_8", "ean_13", "upc_a", "upc_e", "itf"]) {
      expect(isOutOfScopeForMode("access", f)).toBe(true);
    }
  });

  it("permits credential symbologies on an access surface", () => {
    for (const f of ["qr_code", "code_128", "pdf417", "aztec", "data_matrix"]) {
      expect(isOutOfScopeForMode("access", f)).toBe(false);
    }
  });

  it("does not constrain non-access surfaces", () => {
    expect(isOutOfScopeForMode("pos", "ean_13")).toBe(false);
    expect(isOutOfScopeForMode("asset", "ean_13")).toBe(false);
    expect(isOutOfScopeForMode("any", "ean_13")).toBe(false);
  });

  it("permits an unknown/absent format — we only reject what we can identify", () => {
    // Back-compat: a scan queued by an older build replays without `format`.
    // It must still resolve, not fail closed on a missing field.
    expect(isOutOfScopeForMode("access", undefined)).toBe(false);
    expect(isOutOfScopeForMode("access", "some_future_format")).toBe(false);
  });

  it("the client allowlist and the server rule agree", () => {
    // If a format is decodable in access mode it must not be server-rejected —
    // otherwise the camera would produce codes the API refuses, silently.
    for (const f of formatsForMode("access")) {
      expect(isOutOfScopeForMode("access", f)).toBe(false);
    }
  });
});
