import { test } from "playwright/test";
import { writeFileSync } from "node:fs";

/** Narrow diagnostic for the mobile-s overflow on /customers + /features. */
test("customers mobile-s probe", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/customers", { waitUntil: "domcontentloaded" });
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const list: Array<{ tag: string; cls: string; right: number; width: number }> = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.right > vw + 1 || rect.width > vw + 1) {
        list.push({
          tag: el.tagName.toLowerCase(),
          cls: ((el as HTMLElement).className?.toString() || "").slice(0, 140),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    });
    list.sort((a, b) => b.right - a.right);
    return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: list.slice(0, 12) };
  });
  writeFileSync("docs/audits/evidence/customers-probe.json", JSON.stringify(r, null, 2));
});

test("features mobile-s probe", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/features", { waitUntil: "domcontentloaded" });
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const list: Array<{ tag: string; cls: string; right: number; width: number }> = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.right > vw + 0.5 || rect.width > vw + 0.5) {
        list.push({
          tag: el.tagName.toLowerCase(),
          cls: ((el as HTMLElement).className?.toString() || "").slice(0, 140),
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        });
      }
    });
    list.sort((a, b) => b.right - a.right);
    return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: list.slice(0, 12) };
  });
  writeFileSync("docs/audits/evidence/features-probe.json", JSON.stringify(r, null, 2));
});
