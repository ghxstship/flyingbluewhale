import { describe, expect, it } from "vitest";
import {
  classifyGtinScope,
  expandUpcE,
  gtinCheckDigit,
  isGtinFormat,
  isUnresolvableCode,
  isValidGtin,
  normalizeGtin,
} from "./gtin";

/**
 * Fixtures are real consumer barcodes verified against the Open Food Facts
 * production API during the universal-capture research
 * (docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §2.4). The Jack Daniel's
 * code is the one that came back check-digit INVALID — it is the regression
 * fixture proving a malformed code never reaches a resolver or a metered
 * external lookup.
 */
const VALID_UPC_A = {
  titos: "619947000020",
  cocaCola: "049000006346",
  greyGoose: "080480280024",
  jameson: "080432400036",
  pepsi: "012000001291",
} as const;

/** Structurally well-formed, but NOT a real GTIN — fails its own check digit. */
const INVALID_CHECK_DIGIT = "082184090563";

describe("gtinCheckDigit", () => {
  it("computes the mod-10 check digit for a UPC-A body", () => {
    // 61994700002|0 — Tito's; body excludes the trailing check digit.
    expect(gtinCheckDigit("61994700002")).toBe(0);
  });

  it("computes the check digit for an EAN-13 body", () => {
    // 4006381333931 is the canonical GS1 EAN-13 example.
    expect(gtinCheckDigit("400638133393")).toBe(1);
  });
});

describe("isValidGtin", () => {
  it.each(Object.entries(VALID_UPC_A))("accepts real UPC-A: %s", (_name, code) => {
    expect(isValidGtin(code)).toBe(true);
  });

  it("accepts a canonical EAN-13", () => {
    expect(isValidGtin("4006381333931")).toBe(true);
  });

  it("rejects a code whose check digit does not verify", () => {
    expect(isValidGtin(INVALID_CHECK_DIGIT)).toBe(false);
  });

  it("rejects non-GTIN widths", () => {
    expect(isValidGtin("12345")).toBe(false);
    expect(isValidGtin("1234567890123456")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidGtin("ABC-123")).toBe(false);
  });

  it("tolerates separators a wedge scanner or human may introduce", () => {
    expect(isValidGtin("6 1994 70000 2 0")).toBe(true);
  });
});

describe("expandUpcE", () => {
  it("expands a UPC-E to its UPC-A equivalent", () => {
    // 04252614 → 042100005264 is the widely-cited UPC-E worked example.
    expect(expandUpcE("04252614")).toBe("042100005264");
  });

  it("returns null for a non-UPC-E number system", () => {
    expect(expandUpcE("54252614")).toBeNull();
  });

  it("returns null for wrong-width input", () => {
    expect(expandUpcE("0425261")).toBeNull();
  });
});

describe("normalizeGtin", () => {
  it("pads a valid UPC-A to GTIN-14", () => {
    const r = normalizeGtin(VALID_UPC_A.titos);
    expect(r).toEqual({ ok: true, gtin14: "00619947000020" });
  });

  it("normalizes the same product identically from UPC-A and GTIN-14", () => {
    // The core promise: one product, one key, regardless of the symbology read.
    const fromUpcA = normalizeGtin(VALID_UPC_A.cocaCola);
    const fromGtin14 = normalizeGtin("00049000006346");
    expect(fromUpcA.ok && fromGtin14.ok).toBe(true);
    expect(fromUpcA.ok && fromUpcA.gtin14).toBe(fromGtin14.ok && fromGtin14.gtin14);
  });

  it("expands UPC-E before padding, so it agrees with its UPC-A form", () => {
    const fromE = normalizeGtin("04252614");
    const fromA = normalizeGtin("042100005264");
    expect(fromE.ok && fromE.gtin14).toBe("00042100005264");
    expect(fromE.ok && fromE.gtin14).toBe(fromA.ok && fromA.gtin14);
  });

  it("REJECTS a bad check digit — the guard that keeps ITF safe to enable", () => {
    expect(normalizeGtin(INVALID_CHECK_DIGIT)).toEqual({ ok: false, reason: "bad_check_digit" });
  });

  it("rejects non-numeric and wrong-width input", () => {
    expect(normalizeGtin("NOT-A-CODE")).toEqual({ ok: false, reason: "not_numeric" });
    expect(normalizeGtin("12345")).toEqual({ ok: false, reason: "bad_length" });
  });
});

describe("isGtinFormat", () => {
  it("flags retail symbologies for GTIN validation", () => {
    expect(isGtinFormat("ean_13")).toBe(true);
    expect(isGtinFormat("upc_a")).toBe(true);
    expect(isGtinFormat("itf")).toBe(true);
  });

  it("does not flag credential/asset symbologies", () => {
    // A QR wristband payload is not a GTIN and must not be checksum-gated.
    expect(isGtinFormat("qr_code")).toBe(false);
    expect(isGtinFormat("code_128")).toBe(false);
    expect(isGtinFormat(undefined)).toBe(false);
  });
});

describe("classifyGtinScope — resolvable vs structurally unresolvable", () => {
  it("treats ordinary retail GTINs as global", () => {
    for (const code of Object.values(VALID_UPC_A)) {
      expect(classifyGtinScope(code)).toBe("global");
    }
    expect(classifyGtinScope("4006381333931")).toBe("global");
  });

  it("flags US random-weight / deli codes (prefix 02) as variable measure", () => {
    // The digits encode a price or weight for THAT package — a transaction
    // artifact, not a product identity. Nothing to resolve to, ever.
    expect(classifyGtinScope("0212345000004")).toBe("variable_measure");
  });

  it("flags restricted-circulation prefixes 20-29", () => {
    // GS1 GenSpecs: RCNs "SHALL NOT be used globally" and "are NOT GTINs" —
    // but they live in the same numeric ranges, so only the prefix reveals it.
    for (const p of ["20", "21", "22", "24", "26", "28", "29"]) {
      expect(classifyGtinScope(`${p}12345000000`)).toBe("variable_measure");
    }
  });

  it("flags ISBN / ISSN / ISMN as a foreign namespace", () => {
    // 978/979 identify a *title* in another registry; GS1 has no product record.
    expect(classifyGtinScope("9780306406157")).toBe("foreign_namespace");
    expect(classifyGtinScope("9771234567003")).toBe("foreign_namespace");
  });

  it("flags coupon / refund / demo ranges", () => {
    expect(classifyGtinScope("9812345000005")).toBe("coupon");
    expect(classifyGtinScope("9520000000004")).toBe("coupon");
  });

  it("flags company-internal ranges", () => {
    expect(classifyGtinScope("0400000000001")).toBe("restricted");
  });

  it("isUnresolvableCode is true for everything that is not a global GTIN", () => {
    expect(isUnresolvableCode(VALID_UPC_A.titos)).toBe(false);
    expect(isUnresolvableCode("0212345000004")).toBe(true); // deli
    expect(isUnresolvableCode("9780306406157")).toBe(true); // ISBN
    expect(isUnresolvableCode("9812345000005")).toBe(true); // coupon
  });

  it("classifies identically whether the code arrives as UPC-A or GTIN-14", () => {
    // Padding must not shift the prefix window — a code means the same thing
    // regardless of which symbology carried it.
    expect(classifyGtinScope("049000006346")).toBe(classifyGtinScope("00049000006346"));
    expect(classifyGtinScope("0212345000004")).toBe(classifyGtinScope("00212345000004"));
  });
});
