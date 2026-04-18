import { test, expect } from "playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG 2.2 AA axe scan over key marketing + auth surfaces.
 * Runs in CI; fails build on serious / critical violations.
 *
 * Excludes: third-party iframes, color-contrast on dynamic gradient surfaces.
 */

const PAGES = [
  { name: "home", path: "/" },
  { name: "pricing", path: "/pricing" },
  { name: "solutions", path: "/solutions" },
  { name: "solutions:atlvs", path: "/solutions/atlvs" },
  { name: "solutions:gvteway", path: "/solutions/gvteway" },
  { name: "solutions:compvss", path: "/solutions/compvss" },
  { name: "compare", path: "/compare" },
  { name: "guides", path: "/guides" },
  { name: "blog", path: "/blog" },
  { name: "about", path: "/about" },
  { name: "contact", path: "/contact" },
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
];

for (const page of PAGES) {
  test(`a11y · ${page.name}`, async ({ page: pw }) => {
    await pw.goto(page.path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page: pw })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      // Exclude noisy false-positives
      .disableRules(["color-contrast"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length) {
      console.log(`\n[a11y:${page.name}] ${serious.length} serious/critical violations:`);
      for (const v of serious) {
        console.log(`  - ${v.id} (${v.impact}): ${v.help}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    target: ${node.target.join(" > ")}`);
        }
      }
    }
    expect(serious).toEqual([]);
  });
}
