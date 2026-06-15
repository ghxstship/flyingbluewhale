/**
 * Documents generation API — the OpenAPI-described contract that lets internal
 * callers and 3rd-party integrations generate any of the 27 documents.
 *
 *   GET  /api/v1/documents              — list + record-binding flags
 *   GET  /api/v1/documents/{docType}    — JSON Schema + sample + paths
 *   POST /api/v1/documents/{docType}    — render from { data } or { recordId }
 *
 * Logs in as the seeded owner and exercises discovery + external generation.
 */
import { expect, test } from "playwright/test";
import { dismissConsent, loginAs } from "./helpers/auth";

test.describe("documents generation API", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("GET /api/v1/documents lists all 27 doc types, every one record-bound", async ({ page }) => {
    const resp = await page.request.get("/api/v1/documents");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.documents)).toBe(true);
    expect(body.data.documents).toHaveLength(27);
    const invoice = body.data.documents.find((d: { id: string }) => d.id === "invoice");
    expect(invoice).toMatchObject({ id: "invoice", app: "atlvs", recordBinding: true });
    // 100% record-backed: every doc type supports internal ?recordId binding.
    const unbound = body.data.documents.filter((d: { recordBinding: boolean }) => !d.recordBinding);
    expect(unbound, `unbound doc types: ${unbound.map((d: { id: string }) => d.id).join(", ")}`).toHaveLength(0);
  });

  test("GET /api/v1/documents/{docType} returns the data contract", async ({ page }) => {
    const resp = await page.request.get("/api/v1/documents/invoice");
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    expect(data.schema).toBe("invoice");
    expect(data.paths).toContain("invoice.number");
    expect(data.jsonSchema.type).toBe("object");
    expect(data.sample.invoice.number).toBeTruthy();
  });

  test("GET unknown doc type 404s", async ({ page }) => {
    const resp = await page.request.get("/api/v1/documents/not-a-doc");
    expect(resp.status()).toBe(404);
  });

  test("POST {data} renders a document (external generation)", async ({ page }) => {
    const resp = await page.request.post("/api/v1/documents/invoice", {
      data: {
        data: {
          invoice: { number: "INV-TEST-9001", subtotal: "$1,234.00", balance: "$1,234.00" },
          client: { name: "Contract Test Co" },
        },
      },
    });
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    expect(data.html).toContain('data-doc="invoice"');
    expect(data.html).toContain("INV-TEST-9001");
    expect(data.html).toContain("Contract Test Co");
  });

  test("POST without data or recordId is a 400", async ({ page }) => {
    const resp = await page.request.post("/api/v1/documents/invoice", { data: {} });
    expect(resp.status()).toBe(400);
  });

  test("POST {recordId} binds a real org record (internal generation)", async ({ page }) => {
    // Switch to the org that holds the seeded change-order fixture, then bind it.
    const TEST_PORTAL_ORG = "39c5b82a-29fa-47ff-a43c-fe9c116cd27e";
    const r = await page.request.patch("/api/v1/me/workspaces", { data: { orgId: TEST_PORTAL_ORG } });
    expect(r.status()).toBe(200);
    const resp = await page.request.post("/api/v1/documents/changeorder", {
      data: { recordId: "e2e00001-0000-4000-8000-0000000000e2" },
    });
    expect(resp.status()).toBe(200);
    const { data } = await resp.json();
    expect(data.html).toContain("CO-E2E-1"); // the seeded change-order number
    expect(data.data.co.number).toBe("CO-E2E-1");
  });

  test("POST {recordId} for a missing record is a 404", async ({ page }) => {
    // All 27 doc types are record-bound now; a bogus id resolves to nothing.
    const resp = await page.request.post("/api/v1/documents/agreement", {
      data: { recordId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(resp.status()).toBe(404);
  });

  test("unauthenticated requests are rejected", async ({ browser }) => {
    const ctx = await browser.newContext();
    const resp = await ctx.request.get("/api/v1/documents");
    expect(resp.status()).toBe(401);
    await ctx.close();
  });
});
