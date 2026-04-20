/**
 * Happy-path round-trips for routes added in the IA + polish tranches
 * (docs/ia/02-navigation-redesign.md, docs/audit/07-polish-backlog.md).
 *
 * Covers:
 *   - /api/v1/me/workspaces           (GET + PATCH)
 *   - /api/v1/notifications            (GET + PATCH)
 *   - /api/v1/stage-plots              (POST + PATCH + DELETE)
 *   - /api/v1/email-templates/[id]     (PATCH)
 *   - /api/v1/exports/[id]/download    (error path for non-done runs)
 *   - /api/v1/incidents/photo-upload   (POST — signed URL issuer)
 *
 * Each test asserts the envelope contract + status + the one invariant
 * specific to the endpoint (new row persists, state mutation sticks,
 * bad input is rejected with the canonical `bad_request` code, etc.).
 */
import { expect, test, type Page } from "playwright/test";

const PASSWORD = "FlyingBlue!Test2026";

async function dismissConsent(page: Page) {
  await page.context().addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
        }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function loginAs(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(`test+${role}@flyingbluewhale.app`);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 25_000 });
}

test.describe("new API routes — authed happy paths", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("GET /api/v1/me/workspaces returns membership list + current", async ({ page }) => {
    const r = await page.request.get("/api/v1/me/workspaces");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.workspaces)).toBe(true);
    expect(body.data.workspaces.length).toBeGreaterThan(0);
    // Contract: each workspace has { id, name, role } shape
    for (const w of body.data.workspaces) {
      expect(w.id).toEqual(expect.any(String));
      expect(w.name).toEqual(expect.any(String));
      expect(w.role).toEqual(expect.any(String));
    }
  });

  test("PATCH /api/v1/me/workspaces rejects bogus uuid with bad_request", async ({ page }) => {
    const r = await page.request.patch("/api/v1/me/workspaces", {
      data: { orgId: "not-a-uuid" },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("PATCH /api/v1/me/workspaces rejects non-member org with forbidden", async ({ page }) => {
    const r = await page.request.patch("/api/v1/me/workspaces", {
      data: { orgId: "00000000-0000-0000-0000-000000000000" },
    });
    expect([403, 404]).toContain(r.status());
    const body = await r.json();
    expect(["forbidden", "not_found"]).toContain(body.error.code);
  });

  test("GET /api/v1/notifications returns the session's inbox envelope", async ({ page }) => {
    const r = await page.request.get("/api/v1/notifications");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.notifications)).toBe(true);
    expect(typeof body.data.unread).toBe("number");
  });

  test("PATCH /api/v1/notifications with neither ids nor readAll → bad_request", async ({ page }) => {
    const r = await page.request.patch("/api/v1/notifications", { data: {} });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("PATCH /api/v1/notifications readAll=true returns updated count", async ({ page }) => {
    const r = await page.request.patch("/api/v1/notifications", { data: { readAll: true } });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(typeof body.data.updated).toBe("number");
  });

  test("POST + PATCH + DELETE /api/v1/stage-plots round-trips", async ({ page }) => {
    // Need a project id to attach to — list projects and pick the first.
    const plist = await page.request.get("/api/v1/projects");
    expect(plist.status()).toBe(200);
    const pj = await plist.json();
    expect(pj.ok).toBe(true);
    const projectId = pj.data?.projects?.[0]?.id;
    test.skip(!projectId, "Seed has no projects for the owner; plot round-trip skipped.");

    // Create
    const created = await page.request.post("/api/v1/stage-plots", {
      data: {
        projectId,
        name: `e2e-plot-${Date.now()}`,
        widthFt: 24,
        depthFt: 16,
        elements: [],
      },
    });
    expect(created.status()).toBe(201);
    const cb = await created.json();
    expect(cb.ok).toBe(true);
    const plotId = cb.data.stagePlot.id;
    expect(plotId).toEqual(expect.any(String));

    // Patch — widen + add one element
    const patched = await page.request.patch(`/api/v1/stage-plots/${plotId}`, {
      data: {
        widthFt: 32,
        elements: [{ id: "e1", kind: "mic", x: 2, y: 2, w: 1, h: 1 }],
      },
    });
    expect(patched.status()).toBe(200);
    const pb = await patched.json();
    expect(pb.ok).toBe(true);

    // Read back — widthFt should be 32
    const read = await page.request.get(`/api/v1/stage-plots/${plotId}`);
    expect(read.status()).toBe(200);
    const rb = await read.json();
    expect(rb.data.stagePlot.width_ft).toBe(32);

    // Soft-delete
    const del = await page.request.delete(`/api/v1/stage-plots/${plotId}`);
    expect(del.status()).toBe(200);
    const db = await del.json();
    expect(db.ok).toBe(true);

    // After delete the GET should 404
    const gone = await page.request.get(`/api/v1/stage-plots/${plotId}`);
    expect(gone.status()).toBe(404);
  });

  test("GET /api/v1/exports/<nonexistent>/download → not_found", async ({ page }) => {
    const r = await page.request.get("/api/v1/exports/00000000-0000-0000-0000-000000000000/download");
    expect([403, 404]).toContain(r.status());
    const body = await r.json();
    expect(["not_found", "forbidden"]).toContain(body.error.code);
  });

  test("POST /api/v1/incidents/photo-upload returns a signed upload URL for valid input", async ({ page }) => {
    const draftId = crypto.randomUUID();
    const r = await page.request.post("/api/v1/incidents/photo-upload", {
      data: { draftId, filename: "evidence.jpg", contentType: "image/jpeg" },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.data.path).toContain(draftId);
    expect(body.data.uploadUrl).toMatch(/^https?:\/\//);
  });

  test("POST /api/v1/incidents/photo-upload rejects path traversal filename", async ({ page }) => {
    const draftId = crypto.randomUUID();
    const r = await page.request.post("/api/v1/incidents/photo-upload", {
      data: { draftId, filename: "../../../evil.jpg" },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error.code).toBe("bad_request");
  });

  test("PATCH /api/v1/email-templates/<garbage> returns not_found (not 500)", async ({ page }) => {
    const r = await page.request.patch("/api/v1/email-templates/00000000-0000-0000-0000-000000000000", {
      data: { name: "rename" },
    });
    expect([403, 404]).toContain(r.status());
    expect(r.status()).not.toBe(500);
  });
});
