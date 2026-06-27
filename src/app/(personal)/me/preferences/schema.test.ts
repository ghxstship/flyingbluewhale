import { describe, it, expect } from "vitest";
import { PreferencesSchema } from "./schema";

/**
 * Behavioral guard for the /me/preferences save contract.
 *
 * Root cause of the silent-save bug: the form posted color-MODE values
 * (light/dark/system) under `name="theme"`, but the action validated `theme`
 * as the skin-SLUG enum (`atlvs-product`/`system`). When the stored skin was
 * `atlvs-product`, no radio was checked, `theme` was omitted from the
 * FormData, and the slug enum rejected the absent value — failing the WHOLE
 * parse, so locale/timezone/density/consent edits never persisted.
 *
 * The fix drops `theme` from this form entirely (color mode is the orthogonal
 * client-managed `data-mode` axis). These cases lock in that the save no
 * longer depends on a `theme` field, while real validation still bites.
 */
describe("PreferencesSchema", () => {
  const valid = { density: "cozy", locale: "en", timezone: "America/New_York" };

  it("parses a real submission with no `theme` field (the regression)", () => {
    const r = PreferencesSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("never carries a `theme` key (mode/slug vocabularies stay separate)", () => {
    const r = PreferencesSchema.safeParse({ ...valid, analytics: "on" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).not.toHaveProperty("theme");
  });

  it("does NOT accept color-mode values smuggled in as a theme field", () => {
    // Extra unknown keys are stripped by zod's default object behavior, so a
    // stray `theme: "light"` can never gate or pollute the save.
    const r = PreferencesSchema.safeParse({ ...valid, theme: "light" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).not.toHaveProperty("theme");
  });

  it("still enforces a BCP-47 locale", () => {
    expect(PreferencesSchema.safeParse({ ...valid, locale: "english" }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ ...valid, locale: "fr-CA" }).success).toBe(true);
  });

  it("still enforces the density enum and a non-empty timezone", () => {
    expect(PreferencesSchema.safeParse({ ...valid, density: "comfortable" }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ ...valid, timezone: "" }).success).toBe(false);
  });
});
