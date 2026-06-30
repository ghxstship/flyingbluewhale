/**
 * Multitenant matrix — exercise the SAME tenant-scoped surfaces under EVERY
 * workspace the signed-in operator belongs to.
 *
 * The seed gives each user a membership in four orgs at distinct tiers
 * (portal / starter / professional / enterprise — see roles.spec.ts). Most of
 * the suite runs against the default workspace only, so a surface that renders
 * for the default tenant but 500s under a different tier (a missing tier-gated
 * feature flag, a null branding row, an empty-org divide-by-zero) would ship
 * unseen.
 *
 * This spec enumerates the operator's workspaces dynamically via
 * GET /api/v1/me/workspaces (seed-agnostic — no hardcoded org IDs), switches
 * into each with PATCH /api/v1/me/workspaces, and re-crawls a representative
 * tenant-scoped surface set, asserting:
 *   - the switch round-trips (PATCH 200, GET `current` reflects it),
 *   - every surface renders without a 5xx or a crashed (uncaught) render.
 *
 * Plus the negative core-multitenancy invariant: switching into an org the
 * user is NOT a member of is rejected at the boundary (403 forbidden), never
 * silently honored.
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";

type Workspace = { id: string; name: string; role: string };

// A representative slice of tenant-scoped console surfaces — one stable list
// page per major domain. Every org has these regardless of tier/seed depth.
const TENANT_SURFACES = [
  "/studio",
  "/studio/projects",
  "/studio/clients",
  "/studio/finance/invoices",
  "/studio/procurement/vendors",
  "/studio/reports",
  "/studio/settings/organization",
];

async function getWorkspaces(page: import("playwright/test").Page): Promise<{ workspaces: Workspace[]; current: string | null }> {
  const r = await page.request.get("/api/v1/me/workspaces");
  expect(r.status(), "GET /api/v1/me/workspaces").toBe(200);
  const body = await r.json();
  expect(body.ok, "workspaces envelope ok").toBe(true);
  return body.data;
}

test.describe("multitenant matrix", () => {
  test.describe.configure({ timeout: 300000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("operator belongs to >=1 workspace and the list is well-formed", async ({ page }) => {
    const { workspaces } = await getWorkspaces(page);
    expect(workspaces.length, "operator has at least one workspace").toBeGreaterThanOrEqual(1);
    for (const w of workspaces) {
      expect(w.id, "workspace id is a uuid").toMatch(/^[0-9a-f-]{36}$/);
      expect(typeof w.name).toBe("string");
      expect(typeof w.role).toBe("string");
    }
  });

  test("every workspace switch round-trips AND its surfaces render", async ({ page }) => {
    const { workspaces } = await getWorkspaces(page);
    const failures: string[] = [];

    for (const ws of workspaces) {
      // Switch the active tenant.
      const patch = await page.request.patch("/api/v1/me/workspaces", { data: { orgId: ws.id } });
      if (patch.status() !== 200) {
        failures.push(`switch → ${ws.name} (${ws.id}): PATCH ${patch.status()} ${await patch.text()}`);
        continue;
      }
      // Confirm the server pointer actually moved.
      const after = await getWorkspaces(page);
      if (after.current !== ws.id) {
        failures.push(`switch → ${ws.name}: current is ${after.current}, expected ${ws.id}`);
        continue;
      }
      // Re-crawl the representative surfaces under THIS tenant.
      for (const href of TENANT_SURFACES) {
        const pageErrors: string[] = [];
        const onError = (e: Error) => pageErrors.push(e.message);
        page.on("pageerror", onError);
        try {
          const res = await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
          const status = res?.status() ?? 0;
          if (status >= 500) {
            failures.push(`[${ws.name}] ${href} → HTTP ${status}`);
          } else {
            const h1 = page.locator("h1").first();
            const ok = await h1.isVisible().catch(() => false);
            if (!ok && !/\/login(\?|$)/.test(page.url())) failures.push(`[${ws.name}] ${href} → no <h1> (status ${status})`);
            await page.waitForTimeout(200);
            if (pageErrors.length) failures.push(`[${ws.name}] ${href} → uncaught: ${pageErrors[0]}`);
          }
        } catch (e) {
          failures.push(`[${ws.name}] ${href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
        } finally {
          page.off("pageerror", onError);
        }
      }
    }

    expect(
      failures,
      `Tenant surfaces that failed across ${workspaces.length} workspace(s):\n${failures.join("\n")}`,
    ).toEqual([]);
  });

  test("switching into a non-member org is rejected (403)", async ({ page }) => {
    // An RFC-valid v4 uuid (version nibble 4, variant nibble b) the seeded user
    // is not a member of — must clear PatchSchema's z.string().uuid() (which
    // enforces the RFC variant) so the request reaches the membership check and
    // returns 403, rather than 400-ing at validation.
    const r = await page.request.patch("/api/v1/me/workspaces", {
      data: { orgId: "ffffffff-ffff-4fff-bfff-ffffffffffff" },
    });
    expect(r.status(), "non-member workspace switch must be forbidden").toBe(403);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("forbidden");
  });
});
