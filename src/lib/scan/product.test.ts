import { describe, expect, it } from "vitest";
import { bindingMatches, posGtinCandidate, productDisplayName, productLineSubtitle } from "./product";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES } from "@/lib/db/assignments";

/**
 * Kit 30 POS product resolution — the pure decision logic behind resolver 3
 * (`@/lib/db/scan#resolveProductBinding`) and the Confirm Fulfillment action.
 * Fixtures reuse the verified retail barcodes from ./gtin.test.ts.
 */

const TITOS_UPC_A = "619947000020"; // valid UPC-A
const TITOS_GTIN14 = "00619947000020";
const EAN_13 = "4006381333931"; // canonical GS1 example
const INVALID_CHECK_DIGIT = "082184090563";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

describe("posGtinCandidate — the product resolver's admission gate", () => {
  it("normalizes a valid UPC-A to canonical GTIN-14", () => {
    expect(posGtinCandidate(TITOS_UPC_A)).toBe(TITOS_GTIN14);
  });

  it("normalizes an EAN-13 to GTIN-14", () => {
    expect(posGtinCandidate(EAN_13)).toBe("04006381333931");
  });

  it("rejects a code that fails its own check digit (misread, not a product)", () => {
    expect(posGtinCandidate(INVALID_CHECK_DIGIT)).toBeNull();
  });

  it("rejects org-issued codes so they never reach the binding lookup", () => {
    expect(posGtinCandidate("R7-014")).toBeNull(); // asset tag
    expect(posGtinCandidate("WB-2026-00042")).toBeNull(); // wristband serial
    expect(posGtinCandidate("")).toBeNull();
  });

  it("rejects GTIN-shaped codes of the wrong width", () => {
    expect(posGtinCandidate("12345")).toBeNull();
    expect(posGtinCandidate("1234567890123456")).toBeNull();
  });
});

describe("bindingMatches — hit / miss / wrong-org", () => {
  const binding = { org_id: ORG_A, gtin14: TITOS_GTIN14 };

  it("hit: same org, same canonical GTIN", () => {
    expect(bindingMatches(binding, ORG_A, TITOS_GTIN14)).toBe(true);
  });

  it("miss: a different GTIN never matches", () => {
    expect(bindingMatches(binding, ORG_A, "04006381333931")).toBe(false);
  });

  it("wrong org: the same digits are NOT the same binding in another tenant", () => {
    expect(bindingMatches(binding, ORG_B, TITOS_GTIN14)).toBe(false);
  });
});

describe("product display strings", () => {
  it("composes the kit `Kind · Name` display name", () => {
    expect(productDisplayName("Vehicle", "Golf Cart")).toBe("Vehicle · Golf Cart");
  });

  it("joins only the non-empty subtitle parts with the house middot", () => {
    expect(productLineSubtitle(["Jack Sparrow", "III Points Miami 2026", "Oct 20"])).toBe(
      "Jack Sparrow · III Points Miami 2026 · Oct 20",
    );
    expect(productLineSubtitle(["Jack Sparrow", null, undefined])).toBe("Jack Sparrow");
    expect(productLineSubtitle([null, "  ", undefined])).toBe("");
  });
});

describe("confirm-fulfillment transition legality", () => {
  it("approved → delivered is a legal transition (the scan-confirm flip)", () => {
    expect(NEXT_FULFILLMENT_STATES.approved).toContain("delivered");
  });

  it("approved is the ONLY state that may transition to delivered", () => {
    for (const state of FULFILLMENT_STATES) {
      if (state === "approved") continue;
      expect(
        NEXT_FULFILLMENT_STATES[state],
        `${state} must not reach delivered — confirm-on-scan only fulfills approved lines`,
      ).not.toContain("delivered");
    }
  });
});
