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
import { expect, test } from "./helpers/base";
import { authedSetup, dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";
import { FIXTURE_PROJECT } from "./helpers/fixtures";

const PROJECT_ROLES = ["lead", "editor", "contributor", "viewer", "vendor"] as const;

// Shared across the serial describe: the project the owner creates in test 1
// and the collaborator inspects in test 2 — plus the org it lives in, so the
// collaborator (a member of every test org, but defaulting to a DIFFERENT one)
// can pin the same workspace and actually see the project.
let projectId = "";
let projectOrgId = "";

test.describe.serial("ATLVS project roles — member assignment across PROJECT_ROLES", () => {
  // 300s: the 5-role assignment loop is a heavy multi-step UI flow; on a remote
  // target each add + revalidation is markedly slower than local.
  test.describe.configure({ timeout: 300_000 });

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
    const memberRoleSelects = page.locator('select[aria-label*="Role for"]');
    await page.goto(`/studio/projects/${projectId}/members`);
    let count = await memberRoleSelects.count(); // dynamic baseline (0 or auto-added creator)

    for (const role of PROJECT_ROLES) {
      // Reload a CLEAN form each iteration. The in-place revalidation after an add
      // re-renders the AddMemberForm (shrinking candidate list), which on a remote
      // target leaves the submit button transiently unstable; a fresh page load
      // gives a settled form and makes the loop deterministic.
      await page.goto(`/studio/projects/${projectId}/members`);
      const userSelect = page.locator('form select[name="userId"]');
      await expect(userSelect, "manager+ sees the add-member control").toBeVisible({ timeout: 20_000 });

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
      await expect(memberRoleSelects, `member added as ${role}`).toHaveCount(count, { timeout: 20_000 });
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

/**
 * D1 — project-role ENFORCEMENT (the axis the audit found unwired: hasProjectRole
 * had zero call sites). These bind to the durable FIXTURE_PROJECT, where four
 * platform-`member` users hold distinct project roles (member=lead, crew=
 * contributor, contractor=viewer, vendor=vendor — see e2e/helpers/fixtures.ts).
 *
 * Unlike the block above (which drives the management gate as a manager+), these
 * prove per-project authority for NON-manager users end-to-end:
 *   - a project LEAD gains roster management AND a real write persists;
 *   - a project VIEWER is denied — both in the UI (no add control) and, decisively,
 *     at the data layer: the RLS write policy (has_project_role(project_id,['lead']))
 *     rejects their change, so it never persists.
 *
 * Self-restoring: the lead test flips crew's role and sets it back; the viewer
 * test's write is rejected, so the fixture is unchanged either way.
 */
test.describe.serial("ATLVS project roles — non-manager project authority (D1)", () => {
  test.describe.configure({ timeout: 120_000 });
  const CREW = "test+crew@flyingbluewhale.app"; // seeded contributor on FIXTURE_PROJECT
  const VENDOR = "test+vendor@flyingbluewhale.app"; // seeded vendor on FIXTURE_PROJECT
  const membersUrl = `/studio/projects/${FIXTURE_PROJECT.id}/members`;

  test("a project lead (platform member) manages the roster and the write persists", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "member", FIXTURE_PROJECT.orgId);
    await page.goto(membersUrl);

    // The management control denied to the collaborator/viewer is now offered to
    // the project lead — D1 wired hasProjectRole into the page gate.
    await expect(
      page.locator('form select[name="userId"]'),
      "project lead sees the add-member control",
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/view this roster/i), "no view-only notice for the lead").toHaveCount(0);

    // Real WRITE authority (member action + project_members RLS), reversibly:
    // flip crew contributor→editor, confirm it persisted across a reload, restore.
    const crew = () => page.locator(`select[aria-label="Role for ${CREW}"]`);
    await expect(crew()).toBeVisible({ timeout: 10_000 });
    await crew().selectOption("editor");
    // The role select auto-saves via an async server action; the disabled→enabled
    // window is too brief to gate on reliably (on a remote target the write is
    // still in flight when the select re-enables). Poll instead: reload + read
    // until the write is server-visible — deterministic regardless of latency.
    await expect(async () => {
      await page.reload();
      await expect(crew(), "project-lead write persisted through RLS").toHaveValue("editor", { timeout: 5_000 });
    }).toPass({ timeout: 60_000 });

    // Restore the seeded state so the shared fixture stays clean.
    await crew().selectOption("contributor");
    await expect(async () => {
      await page.reload();
      await expect(crew()).toHaveValue("contributor", { timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
  });

  test("a project viewer (platform member) is denied roster management, in UI and at the write", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "contractor", FIXTURE_PROJECT.orgId);
    await page.goto(membersUrl);

    // Management gate: no add-member control; the view-only notice is shown.
    await expect(page.getByRole("heading", { name: /members/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('form select[name="userId"]'),
      "no add-member control for a project viewer",
    ).toHaveCount(0);
    await expect(page.getByText(/view this roster/i), "view-only notice shown to the viewer").toBeVisible();

    // Write DENIAL at the data layer: the role <select> is still rendered, but a
    // viewer's change must NOT persist — the project_members RLS write policy
    // (has_project_role(project_id,['lead'])) rejects it, so it snaps back.
    const vendor = () => page.locator(`select[aria-label="Role for ${VENDOR}"]`);
    await expect(vendor()).toBeVisible({ timeout: 10_000 });
    await expect(vendor()).toHaveValue("vendor");
    await vendor().selectOption("editor");
    await page.waitForTimeout(1500); // allow the (rejected) update action to round-trip
    await page.reload();
    await expect(vendor(), "viewer write was rejected by RLS — no persistence").toHaveValue("vendor", {
      timeout: 10_000,
    });
  });
});
