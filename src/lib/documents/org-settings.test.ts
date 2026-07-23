import { describe, expect, it } from "vitest";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import {
  DOC_BRAND_MODES,
  docDefaultBrand,
  EMPTY_DOC_SETTINGS,
  getOrgDocSettings,
  isDocBrandMode,
  isDocTypeOffered,
  partitionDocTemplates,
  toDocSettingsMap,
} from "./org-settings";

/**
 * Configurator v1 enforcement (L-P2) — org_doc_template_settings semantics:
 * a disabled doc type is hidden from creation pickers but stays renderable
 * for existing records; absence of a row means the registry default.
 */
describe("org doc template settings enforcement", () => {
  it("defaults: no settings row means offered, no default brand", () => {
    expect(isDocTypeOffered("proposal", EMPTY_DOC_SETTINGS)).toBe(true);
    expect(docDefaultBrand("proposal", EMPTY_DOC_SETTINGS)).toBeNull();
    const { offered, disabled } = partitionDocTemplates(DOC_TEMPLATES, EMPTY_DOC_SETTINGS);
    expect(offered.length).toBe(DOC_TEMPLATES.length);
    expect(disabled).toEqual([]);
  });

  it("a disabled type is removed from the offered picker set but retained (not dropped)", () => {
    const settings = toDocSettingsMap([
      { doc_type: "proposal", enabled: false, default_brand: null, notes: null },
    ]);
    expect(isDocTypeOffered("proposal", settings)).toBe(false);
    const { offered, disabled } = partitionDocTemplates(DOC_TEMPLATES, settings);
    expect(offered.length).toBe(DOC_TEMPLATES.length - 1);
    expect(disabled.map((t) => t.id)).toEqual(["proposal"]);
    // Renderability rule: the disabled template object is still fully
    // available to render existing records — enforcement is picker-side only.
    expect(disabled[0]).toBe(DOC_TEMPLATES.find((t) => t.id === "proposal"));
  });

  it("an enabled row with a default brand annotates without hiding", () => {
    const settings = toDocSettingsMap([
      { doc_type: "invoice", enabled: true, default_brand: "white", notes: "client-facing" },
    ]);
    expect(isDocTypeOffered("invoice", settings)).toBe(true);
    expect(docDefaultBrand("invoice", settings)).toBe("white");
  });

  it("junk brand values coerce to null; brand mode guard matches the kit modes", () => {
    expect([...DOC_BRAND_MODES]).toEqual(["atlvs", "co", "white"]);
    expect(isDocBrandMode("co")).toBe(true);
    expect(isDocBrandMode("rainbow")).toBe(false);
    const settings = toDocSettingsMap([
      { doc_type: "invoice", enabled: true, default_brand: "rainbow", notes: null },
    ]);
    expect(docDefaultBrand("invoice", settings)).toBeNull();
  });

  it("settings for unknown doc types do not affect registry types", () => {
    const settings = toDocSettingsMap([
      { doc_type: "not-a-real-type", enabled: false, default_brand: null, notes: null },
    ]);
    const { offered, disabled } = partitionDocTemplates(DOC_TEMPLATES, settings);
    expect(offered.length).toBe(DOC_TEMPLATES.length);
    expect(disabled).toEqual([]);
  });

  it("getOrgDocSettings fails OPEN on query error (pre-migration safety)", async () => {
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "relation does not exist" } }),
        }),
      }),
    };
    const map = await getOrgDocSettings(failing, "org-1");
    expect(map.size).toBe(0);
    expect(isDocTypeOffered("proposal", map)).toBe(true);

    const throwing = {
      from: () => {
        throw new Error("boom");
      },
    };
    expect((await getOrgDocSettings(throwing, "org-1")).size).toBe(0);
  });

  it("getOrgDocSettings maps live rows", async () => {
    const db = {
      from: () => ({
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                { doc_type: "proposal", enabled: false, default_brand: "co", notes: null },
                { doc_type: "invoice", enabled: true, default_brand: null, notes: "x" },
              ],
              error: null,
            }),
        }),
      }),
    };
    const map = await getOrgDocSettings(db, "org-1");
    expect(map.size).toBe(2);
    expect(isDocTypeOffered("proposal", map)).toBe(false);
    expect(docDefaultBrand("proposal", map)).toBe("co");
    expect(isDocTypeOffered("invoice", map)).toBe(true);
  });
});
