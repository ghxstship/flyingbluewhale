/**
 * V6 Documents system clickthrough — the document library hub plus every one of
 * the 29 doc templates. Each route must render the on-screen `.doc` artifact
 * (proving the DocEngine + kit-documents.css format layer resolve), and an
 * unknown doc id must 404. Drives the same templates the kit ships as built
 * reference docs.
 */
import { test, expect } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { DOC_TEMPLATES } from "../src/lib/documents/registry";

test.describe("V6 documents", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "admin");
  });

  test("hub lists every template grouped by app", async ({ page }) => {
    await page.goto("/studio/documents");
    await expect(page.getByRole("heading", { name: "DOCUMENT LIBRARY" })).toBeVisible();
    // every template surfaces as a link to its preview route
    for (const tpl of DOC_TEMPLATES) {
      await expect(page.locator(`a[href="/studio/documents/${tpl.id}"]`)).toBeVisible();
    }
  });

  for (const tpl of DOC_TEMPLATES) {
    test(`renders ${tpl.id} (${tpl.app})`, async ({ page }) => {
      await page.goto(`/studio/documents/${tpl.id}`);
      // the document artifact is present and carries its schema contract
      const doc = page.locator(`.doc[data-doc="${tpl.schema}"]`);
      await expect(doc).toBeVisible();
      // at least one merge field renders the data-path contract
      await expect(doc.locator(".mf").first()).toBeVisible();
      // viewer toolbar affordances exist
      await expect(page.getByRole("button", { name: "Print / PDF" })).toBeVisible();
    });
  }

  test("unknown document id renders not-found (no doc artifact)", async ({ page }) => {
    // notFound() streams the (platform) not-found boundary. With dynamic RSC
    // streaming the HTTP shell can be 200, so assert on the rendered UI: the
    // not-found page shows and no document artifact is present.
    await page.goto("/studio/documents/not-a-real-doc");
    await expect(page.getByText("Back to Workspace")).toBeVisible();
    await expect(page.locator(".doc")).toHaveCount(0);
  });

  test("merge-field highlight toggles off", async ({ page }) => {
    await page.goto("/studio/documents/invoice");
    const doc = page.locator('.doc[data-doc="invoice"]');
    await expect(doc).toHaveAttribute("data-mf", "on");
    await page.getByLabel("Highlight merge fields").uncheck();
    await expect(doc).toHaveAttribute("data-mf", "off");
  });

  test("white-label brand mode strips ATLVS attribution", async ({ page }) => {
    await page.goto("/studio/documents/proposal");
    const doc = page.locator('.doc[data-doc="proposal"]');
    await page.getByRole("button", { name: "White-label" }).click();
    await expect(doc).toHaveAttribute("data-brand", "white");
  });
});
