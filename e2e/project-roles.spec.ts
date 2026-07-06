/**
 * Project roles (project_members) — the per-project authority axis, distinct
 * from the org platform-role band exercised by roles.spec / atlvs-console-
 * personas. The five ProjectRoles (lead · editor · contributor · viewer ·
 * vendor) are assigned on /studio/projects/[id]/members and read by
 * `hasProjectRole` + the portal project picker.
 *
 * The console gates member MANAGEMENT on the platform band (manager+ via
 * `isManagerPlus`), so this spec covers the model as the app actually enforces
 * it:
 *   1. A manager+ operator (owner) creates a project and assigns EACH of the
 *      five ProjectRoles to a distinct seeded org member — proving every role
 *      in PROJECT_ROLES round-trips (write → persisted → rendered).
 *   2. A non-manager operator (collaborator) can VIEW the members surface
 *      (org-scoped read) but is NOT offered the add-member control — the
 *      management gate holds without crashing.
 *
 * Self-cleaning: the project is named `E2E ProjectRoles …` so the post-run
 * fixture purge (scripts/e2e-clean-fixtures.mjs) removes it (project_members
 * cascade), keeping the shared prod fixtures clean.
 */
import { expect, test } from "playwright/test";
import { authedSetup, dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const PROJECT_ROLES = ["lead", "editor", "contributor", "viewer", "vendor"] as const;

// Shared across the serial describe: the project the owner creates in test 1
// and the collaborator inspects in test 2 — plus the org it lives in, so the
// collaborator (a member of every test org, but defaulting to a DIFFERENT one)
// can pin the same workspace and actually see the project.
let projectId = "";
let projectOrgId = "";

test.describe.serial("ATLVS project roles — member assignment across PROJECT_ROLES", () => {
  test.describe.configure({ timeout: 180_000 });

  test("owner creates a project and assigns all five project roles", async ({ page }) => {
    await authedSetup(page, "owner");

    // 1. Create the project; capture its id from the post-create detail URL.
    await createInModule(page, "/studio/projects/new", { name: `E2E ProjectRoles ${stamp()}` });
    const match = page.url().match(/\/projects\/([0-9a-f-]{36})/i);
    projectId = match?.[1] ?? "";
    expect(projectId, "project id resolved from the create redirect").toBeTruthy();

    // Capture the org the project lives in (the owner's active workspace) so the
    // collaborator can pin the same one in test 2.
    const wr = await page.request.get("/api/v1/me/workspaces");
    projectOrgId = (await wr.json())?.data?.current ?? "";
    expect(projectOrgId, "active org captured").toBeTruthy();

    // 2. Assign each ProjectRole to the first still-available org member.
    // Each member row renders a `<select aria-label="Role for <email>">` whose
    // value is that member's role — count those to confirm each add landed
    // (unambiguous, unlike matching the role word which also hits <option>s).
    await page.goto(`/studio/projects/${projectId}/members`);
    const memberRoleSelects = page.locator('select[aria-label*="Role for"]');
    let count = await memberRoleSelects.count(); // dynamic baseline (0 or auto-added creator)

    for (const role of PROJECT_ROLES) {
      const userSelect = page.locator('form select[name="userId"]');
      await expect(userSelect, "manager+ sees the add-member control").toBeVisible({ timeout: 10_000 });

      // First non-empty candidate (the list shrinks as members are added).
      const value = await userSelect
        .locator("option")
        .evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => o.value).find((v) => v) ?? "");
      expect(value, `a candidate remains to assign as ${role}`).toBeTruthy();

      await userSelect.selectOption(value);
      await page.locator('form select[name="role"]').selectOption(role);
      await page.getByRole("button", { name: /^add$/i }).click();

      // Revalidation adds the member row — wait for the count to grow.
      count += 1;
      await expect(memberRoleSelects, `member added as ${role}`).toHaveCount(count, { timeout: 15_000 });
    }

    // 3. Every ProjectRole is represented among the persisted member rows.
    await page.goto(`/studio/projects/${projectId}/members`);
    const assigned = await memberRoleSelects.evaluateAll((sels) =>
      (sels as HTMLSelectElement[]).map((s) => s.value),
    );
    for (const role of PROJECT_ROLES) {
      expect(assigned, `${role} persisted on a member`).toContain(role);
    }
  });

  test("collaborator can view members but is not offered the management control", async ({ page }) => {
    test.skip(!projectId || !projectOrgId, "project/org was not established in the prior test");
    // Pin the SAME workspace the project lives in — otherwise the org-scoped
    // members query notFound()s (a valid gate, but it would test org-mismatch,
    // not the role gate). With the org pinned, the collaborator genuinely sees
    // the project and the assertion isolates the management gate.
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "collaborator", projectOrgId);

    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(`/studio/projects/${projectId}/members`);
    expect(res?.status(), "members surface must not 5xx for a lower role").toBeLessThan(500);

    // Org-scoped read: the members surface renders, but the manager-only
    // add-member control is absent — the management gate, not a crash.
    await expect(page.getByRole("heading", { name: /members/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('form select[name="userId"]'), "no add-member control for non-manager").toHaveCount(0);
    const fatal = errors.filter((e) => !e.includes("favicon") && !e.includes("404"));
    expect(fatal, "the gate must not crash the render").toEqual([]);
  });
});
