import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Personal-scope guard (COMPVSS mobile parity audit, D6 + G13 follow-on).
 *
 * COMPVSS surfaces that are titled as the viewer's own — "My Tasks", the
 * approvals queue, personal time off — must actually filter to the viewer.
 * Two shipped without a predicate:
 *
 *   /m/tasks    listOrgScoped("tasks", orgId) with no assignee filter. On
 *               the seeded org that returned 201 rows, 2 of them the
 *               viewer's. Because tasks with no due date sort last under
 *               `orderBy: due_at`, the viewer's own work fell past the list
 *               cap — the page named for them could not show them.
 *   /m/requests read every colleague's time-off reason for non-managers;
 *               only the decision buttons were gated (fixed in Phase 0).
 *               The surface is now the approval_instances engine
 *               (approval.clear) — same invariant, new predicate: members
 *               see only the instances they initiated.
 *
 * RLS is `is_org_member` on both tables, so it is NOT a backstop here: the
 * filter has to be explicit in the query. This guard is a cheap ratchet
 * against the predicate being dropped again.
 */
const ROOT = process.cwd();

describe("COMPVSS personal-scope reads are filtered to the viewer", () => {
  it("/m/tasks filters tasks to the signed-in assignee", () => {
    const src = readFileSync(join(ROOT, "src/app/(mobile)/m/tasks/page.tsx"), "utf8");
    expect(src).toMatch(/listOrgScoped\(\s*"tasks"/);
    // The read must carry an assigned_to predicate bound to the session.
    expect(src).toMatch(/column:\s*"assigned_to"[\s\S]{0,60}session\.userId/);
  });

  it("/m/requests binds non-manager reads to the viewer's own instances", () => {
    const src = readFileSync(join(ROOT, "src/app/(mobile)/m/requests/page.tsx"), "utf8");
    // The engine read must branch on the band, and the non-manager branch
    // must carry the initiated_by predicate bound to the session (RLS is
    // is_org_member, so without it every member reads the whole org queue).
    expect(src).toMatch(/if\s*\(manager\)\s*\{/);
    expect(src).toMatch(/query\s*=\s*query\.eq\("initiated_by",\s*session\.userId\)/);
  });
});
