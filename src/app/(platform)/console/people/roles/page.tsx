import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { CustomRoleForm } from "./CustomRoleForm";
import { deleteCustomRole } from "./actions";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

const PLATFORM_ROLES: { role: string; description: string; tier: "all" | "professional" | "enterprise" }[] = [
  { role: "owner", description: "Full access · billing · delete organization", tier: "all" },
  { role: "admin", description: "Full access except billing + org delete", tier: "all" },
  { role: "controller", description: "Finance, procurement, approvals", tier: "all" },
  { role: "collaborator", description: "Projects, tasks, crew, clients, proposals", tier: "all" },
  { role: "contractor", description: "Project-scoped vendor view + time logging", tier: "professional" },
  { role: "crew", description: "Day-of tasks, check-in, clock-in", tier: "all" },
  { role: "client", description: "Client portal — proposals, deliverables, invoices", tier: "all" },
  { role: "viewer", description: "Read-only on assigned projects", tier: "all" },
  { role: "community", description: "No org access", tier: "all" },
  { role: "developer", description: "API keys + webhooks + audit", tier: "enterprise" },
];

export default async function RolesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People" title="Role matrix" />
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
        title="Role matrix"
        subtitle="Platform roles + your custom roles"
      />
      <div className="page-content max-w-5xl space-y-6">
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Platform roles
          </h3>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_ROLES.map((r) => (
                  <tr key={r.role}>
                    <td><Badge variant="brand">{r.role}</Badge></td>
                    <td className="font-mono text-xs">{r.tier}</td>
                    <td className="text-[var(--text-secondary)]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Custom roles</h3>
            <CustomRoleForm />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Custom roles layer on top of platform roles. Use them to scope a
            specific permission set per team (e.g. <code>finance-reader</code>,{" "}
            <code>safety-officer</code>).
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
                    <td className="text-xs text-[var(--text-secondary)]">
                      {(r.permissions ?? []).join(", ") || "—"}
                    </td>
                    <td>
                      {!r.is_system && (
                        <form action={deleteCustomRole}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className="text-xs text-[var(--color-error)] hover:underline"
                          >
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
