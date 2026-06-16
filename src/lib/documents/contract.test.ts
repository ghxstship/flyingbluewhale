/**
 * Document contract guard. The OpenAPI/JSON-Schema contract is DERIVED from the
 * template registry, so this test pins the derivation: every template yields a
 * non-empty, round-trippable contract, and the path helpers behave.
 */
import { describe, it, expect } from "vitest";
import { DOC_TEMPLATES } from "./registry";
import { contractOf, getPath, setPath, mergeFields, sample } from "./contract";

describe("document contract", () => {
  it("registry has all 29 doc types with unique ids", () => {
    expect(DOC_TEMPLATES).toHaveLength(29);
    expect(new Set(DOC_TEMPLATES.map((t) => t.id)).size).toBe(29);
  });

  it("every template derives a non-empty contract whose paths resolve in its sample", () => {
    for (const t of DOC_TEMPLATES) {
      const c = contractOf(t);
      expect(c.paths.length, `${t.id} has merge fields`).toBeGreaterThan(0);
      expect(c.jsonSchema.type).toBe("object");
      // every declared path is reachable in the sample object (no orphan paths)
      for (const p of c.paths) {
        expect(getPath(c.sample, p), `${t.id}:${p} resolves in sample`).toBeDefined();
      }
    }
  });

  it("sample values round-trip through the data binding", () => {
    for (const t of DOC_TEMPLATES) {
      const data = sample(t);
      for (const f of mergeFields(t)) {
        // the sample object yields exactly the embedded sample value at each path
        expect(getPath(data, f.path)).toBe(f.value);
      }
    }
  });

  it("setPath/getPath handle nested objects and array indices", () => {
    const o: Record<string, unknown> = {};
    setPath(o, "invoice.number", "INV-1");
    setPath(o, "invoice.lines.0.desc", "A");
    setPath(o, "invoice.lines.1.desc", "B");
    expect(getPath(o, "invoice.number")).toBe("INV-1");
    expect(getPath(o, "invoice.lines.0.desc")).toBe("A");
    expect(getPath(o, "invoice.lines.1.desc")).toBe("B");
    // numeric segments build object keys (schemaOf recovers the array shape);
    // getPath still reads real arrays too (resolvers emit those).
    expect(getPath({ invoice: { lines: [{ desc: "X" }] } }, "invoice.lines.0.desc")).toBe("X");
    expect(getPath(o, "invoice.missing.path")).toBeUndefined();
  });

  it("derives array schemas for indexed paths (line items)", () => {
    const invoice = DOC_TEMPLATES.find((t) => t.id === "invoice")!;
    const c = contractOf(invoice);
    // walk invoice → lines; lines has only numeric keys in the sample → array
    const root = c.jsonSchema as { type: string; properties: Record<string, unknown> };
    const inv = root.properties.invoice as { properties: Record<string, { type: string }> };
    expect(inv.properties.lines?.type).toBe("array");
  });
});
