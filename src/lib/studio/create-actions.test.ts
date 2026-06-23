import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { CONSOLE_CREATE_ACTIONS } from "./create-actions.generated";

/**
 * ⌘K Create-registry guard (workflow audit F-A). The generated registry must
 * stay in sync with the route tree so every new /studio/<x>/new gets a
 * quick-create for free. Regenerate with `npm run gen:create-actions`.
 */
describe("console create actions (⌘K F-A)", () => {
  it("is regenerated + in sync with the route tree", () => {
    expect(() =>
      execFileSync("node", [join(process.cwd(), "scripts/gen-create-actions.mjs"), "--check"], { cwd: process.cwd() }),
    ).not.toThrow();
  });

  it("covers the full creatable surface (far beyond the original 6)", () => {
    expect(CONSOLE_CREATE_ACTIONS.length).toBeGreaterThan(100);
  });

  it("every action is a static /studio/**/new href (no project-scoped params)", () => {
    for (const a of CONSOLE_CREATE_ACTIONS) {
      expect(a.href).toMatch(/^\/studio\/.+\/new$/);
      expect(a.href).not.toContain("[");
      expect(a.label.startsWith("New ")).toBe(true);
    }
  });
});
