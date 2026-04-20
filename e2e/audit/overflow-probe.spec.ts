/**
 * One-off diagnostic — identify the widest offending element at 1280×800
 * on the marketing home route so we can file a root-cause remediation
 * rather than a shotgun breakpoint sweep.
 */
import { test } from "playwright/test";
import { writeFileSync } from "node:fs";

test("widest-elements probe at 1280 on /", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const report = await page.evaluate(() => {
    const vw = window.innerWidth;
    // Probe the marketing header flex container explicitly
    const flexRow = document.querySelector("header .mx-auto.flex.max-w-6xl") as HTMLElement | null;
    const flexRect = flexRow?.getBoundingClientRect();
    const flexChildren = flexRow
      ? Array.from(flexRow.children).map((c) => {
          const r = (c as HTMLElement).getBoundingClientRect();
          return {
            tag: c.tagName.toLowerCase(),
            cls: ((c as HTMLElement).className?.toString() || "").slice(0, 120),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
          };
        })
      : [];
    const list: Array<{ tag: string; cls: string; width: number; left: number; right: number; id: string; parent: string }> = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.right > vw + 2 || r.width > vw + 2) {
        const parent = (el.parentElement as HTMLElement | null);
        list.push({
          tag: el.tagName.toLowerCase(),
          cls: ((el as HTMLElement).className?.toString() || "").slice(0, 160),
          id: (el as HTMLElement).id || "",
          width: Math.round(r.width),
          left: Math.round(r.left),
          right: Math.round(r.right),
          parent: parent ? `${parent.tagName.toLowerCase()}.${(parent.className?.toString() || "").slice(0, 80)}` : "",
        });
      }
    });
    // Sort by `right` descending so the worst offenders surface first.
    list.sort((a, b) => b.right - a.right);
    return {
      viewport: vw,
      scrollWidth: document.documentElement.scrollWidth,
      flexContainer: flexRect
        ? {
            left: Math.round(flexRect.left),
            right: Math.round(flexRect.right),
            width: Math.round(flexRect.width),
            children: flexChildren,
          }
        : null,
      count: list.length,
      top20: list.slice(0, 20),
    };
  });
  writeFileSync("docs/audits/evidence/overflow-probe.json", JSON.stringify(report, null, 2));
});
