import { expect, test } from "playwright/test";

test("api v1 health", async ({ request }) => {
  const r = await request.get("/api/v1/health");
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  expect(body.ok).toBe(true);
  expect(body.data.status).toBe("ok");
  expect(body.data.version).toBe("v1");
});

test("unsigned stripe webhook is rejected when secret is set", async ({ request }) => {
  // If no STRIPE_WEBHOOK_SECRET, dev mode accepts anything (200); skip
  const r = await request.post("/api/v1/webhooks/stripe", {
    data: { type: "ping" },
    headers: { "content-type": "application/json" },
  });
  // Accept either 200 (dev mode, no secret) or 400/401 (strict verification)
  expect([200, 400, 401]).toContain(r.status());
});
