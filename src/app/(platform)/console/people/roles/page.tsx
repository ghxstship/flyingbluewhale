import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { CustomRoleForm } from "./CustomRoleForm";
import { deleteCustomRole } from "./actions";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

const PLATFORM_ROLES_INFO: { role: string; description: string; tier: "all" | "professional" | "enterprise" }[] = [
  { role: "owner", description: "Billing · delete org · everything else", tier: "all" },
  { role: "admin", description: "Full org control except billing + org delete", tier: "all" },
  { role: "manager", description: "Manage projects + people, no billing or org settings", tier: "all" },
  { role: "member", description: "Default — access governed by per-project membership", tier: "all" },
];

const PROJECT_ROLES_INFO: { role: string; description: string }[] = [
  { role: "lead", description: "Producer/PM — full project control, approve, close" },
  { role: "editor", description: "Read/write team work — tasks, deliverables, schedule" },
  { role: "contributor", description: "Write own work, read project (crew, contractors)" },
  { role: "viewer", description: "Read-only — clients, sponsors, observers" },
  { role: "vendor", description: "Scoped to their own POs, deliverables, invoices" },
];

export default async function RolesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People" title="Role Matrix" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: customRoles } = await supabase
    .from("org_roles")
    .select("id, slug, label, description, permissions, is_system, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  return (
    <>
      <ModuleHeader
        eyebrow="People"
        title="Role Matrix"
        subtitle="Platform roles (billing) · project roles (operations) · custom overlays"
      />
      <div className="page-content max-w-5xl space-y-6">
        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Platform roles — org-level, govern billing & access
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_ROLES_INFO.map((r) => (
                  <tr key={r.role}>
                    <td>
                      <Badge variant="brand">{r.role}</Badge>
                    </td>
                    <td className="font-mono text-xs">{r.tier}</td>
                    <td className="text-[var(--text-secondary)]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Project roles — per-project, govern operational access
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {PROJECT_ROLES_INFO.map((r) => (
                  <tr key={r.role}>
                    <td>
                      <Badge variant="info">{r.role}</Badge>
                    </td>
                    <td className="text-[var(--text-secondary)]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Platform <code>owner</code>, <code>admin</code>, and <code>manager</code> auto-bypass project_members and
            act as project <code>lead</code> on every project in the org.
          </p>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Custom Roles</h3>
            <CustomRoleForm />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Custom roles layer on top of platform roles. Use them to scope a specific permission set per team (e.g.{" "}
            <code>finance-reader</code>, <code>safety-officer</code>).
          </p>
          <table className="data-table mt-4 w-full text-sm">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Label</th>
                <th>Description</th>
                <th>Permissions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(customRoles ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                    No custom roles yet.
                  </td>
                </tr>
              ) : (
                (customRoles ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.slug}</td>
                    <td>{r.label}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{r.description ?? "—"}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{(r.permissions ?? []).join(", ") || "—"}</td>
                    <td>
                      {!r.is_system && (
                        <form action={deleteCustomRole}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="text-xs text-[var(--color-error)] hover:underline">
                            Delete
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
