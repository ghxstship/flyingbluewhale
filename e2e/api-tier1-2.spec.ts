/**
 * Contract + happy/failure-path coverage for the API routes added in the
 * Tier 1+2 tranche (commit 73f9844):
 *
 *   - GET  /api/v1/me/export       — GDPR/DSAR data export bundle
 *   - POST /api/v1/shifts/checkin  — COMPVSS shift T&A punch FSM
 *
 * me/export streams a raw JSON attachment (NOT the apiOk envelope), so we
 * assert the download headers + bundle shape. shifts/checkin is envelope-based
 * and FSM-guarded, so we assert input validation + the canonical error codes
 * (the happy-path punch needs a seeded `scheduled` shift, covered separately).
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

test.describe("Tier 1+2 API — me/export + shifts/checkin", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("GET /api/v1/me/export returns a downloadable JSON bundle of the user's data", async ({ page }) => {
    const r = await page.request.get("/api/v1/me/export");
    // The export is rate-limited (~1/day per the GDPR contract). A warm
    // in-memory bucket from a prior run in the same server process can 429 —
    // accept that, but on a 200 enforce the full download contract.
    expect([200, 429]).toContain(r.status());
    if (r.status() === 429) {
      const body = await r.json();
      expect(body.error.code).toBe("rate_limited");
      return;
    }
    expect(r.headers()["content-type"]).toContain("application/json");
    expect(r.headers()["content-disposition"]).toContain("attachment");
    expect(r.headers()["content-disposition"]).toContain("atlvs-export-");
    const bundle = await r.json();
    // Bundle masthead — exportedAt + the authed user identity.
    expect(typeof bundle.exportedAt).toBe("string");
    expect(bundle.user?.id).toEqual(expect.any(String));
    expect(bundle.user?.email).toEqual(expect.any(String));
    // Every PII-bearing table is present as an array (empty is fine).
    for (const table of ["users", "memberships", "notifications", "time_entries"]) {
      expect(Array.isArray(bundle[table]), `bundle.${table} should be an array`).toBe(true);
    }
  });

  test("GET /api/v1/me/export requires auth", async ({ browser }) => {
    // Fresh context with no session → the endpoint must refuse, not 500.
    const ctx = await browser.newContext();
    try {
      const r = await ctx.request.get("/api/v1/me/export");
      expect([401, 429]).toContain(r.status());
      if (r.status() === 401) {
        const body = await r.json();
        expect(body.error.code).toBe("unauthorized");
      }
    } finally {
      await ctx.close();
    }
  });

  test("POST /api/v1/shifts/checkin rejects a non-uuid shiftId with bad_request", async ({ page }) => {
    const r = await page.request.post("/api/v1/shifts/checkin", {
      data: { shiftId: "not-a-uuid", action: "check_in" },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("POST /api/v1/shifts/checkin rejects an unknown action with bad_request", async ({ page }) => {
    const r = await page.request.post("/api/v1/shifts/checkin", {
      data: { shiftId: ZERO_UUID, action: "teleport" },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("POST /api/v1/shifts/checkin rejects a future-dated punch (clock-skew clamp)", async ({ page }) => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString(); // +1h
    const r = await page.request.post("/api/v1/shifts/checkin", {
      data: { shiftId: ZERO_UUID, action: "check_in", at: future },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("POST /api/v1/shifts/checkin on a nonexistent shift → not_found (not 500)", async ({ page }) => {
    const r = await page.request.post("/api/v1/shifts/checkin", {
      data: { shiftId: ZERO_UUID, action: "check_in" },
    });
    expect(r.status()).not.toBe(500);
    expect([404, 403]).toContain(r.status());
    const body = await r.json();
    expect(["not_found", "forbidden"]).toContain(body.error.code);
  });
});
