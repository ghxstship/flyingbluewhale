import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { CustomRoleForm } from "./CustomRoleForm";
import { deleteCustomRole } from "./actions";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.roles.eyebrow", undefined, "People")}
          title={t("console.people.roles.title", undefined, "Role Matrix")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.roles.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.people.roles.eyebrow", undefined, "People")}
        title={t("console.people.roles.title", undefined, "Role Matrix")}
        subtitle={t(
          "console.people.roles.subtitle",
          undefined,
          "Platform Roles — Billing · Project Roles — Operations · Custom Overlays",
        )}
      />
      <div className="page-content max-w-5xl space-y-6">
        <section>
          <h3 className="mb-2 text-xs tracking-[0.18em] text-[var(--text-muted)] uppercase">
            {t(
              "console.people.roles.platformHeading",
              undefined,
              "Platform roles — org-level, govern billing & access",
            )}
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.people.roles.col.role", undefined, "Role")}</th>
                  <th>{t("console.people.roles.col.tier", undefined, "Tier")}</th>
                  <th>{t("console.people.roles.col.capabilities", undefined, "Capabilities")}</th>
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
            {t(
              "console.people.roles.projectHeading",
              undefined,
              "Project roles — per-project, govern operational access",
            )}
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.people.roles.col.role", undefined, "Role")}</th>
                  <th>{t("console.people.roles.col.capabilities", undefined, "Capabilities")}</th>
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
            {t("console.people.roles.bypassNote.prefix", undefined, "Platform ")}
            <code>owner</code>
            {t("console.people.roles.bypassNote.comma1", undefined, ", ")}
            <code>admin</code>
            {t("console.people.roles.bypassNote.and", undefined, ", and ")}
            <code>manager</code>
            {t("console.people.roles.bypassNote.middle", undefined, " auto-bypass project_members and act as project ")}
            <code>lead</code>
            {t("console.people.roles.bypassNote.suffix", undefined, " on every project in the org.")}
          </p>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.people.roles.custom.heading", undefined, "Custom Roles")}
            </h3>
            <CustomRoleForm />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(
              "console.people.roles.custom.intro",
              undefined,
              "Custom roles layer on top of platform roles. Use them to scope a specific permission set per team (e.g. ",
            )}
            <code>finance-reader</code>
            {t("console.people.roles.custom.intro.comma", undefined, ", ")}
            <code>safety-officer</code>
            {t("console.people.roles.custom.intro.suffix", undefined, ").")}
          </p>
          <table className="data-table mt-4 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.people.roles.col.slug", undefined, "Slug")}</th>
                <th>{t("console.people.roles.col.label", undefined, "Label")}</th>
                <th>{t("console.people.roles.col.description", undefined, "Description")}</th>
                <th>{t("console.people.roles.col.permissions", undefined, "Permissions")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(customRoles ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                    {t("console.people.roles.empty", undefined, "No custom roles yet.")}
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
                            {t("common.delete", undefined, "Delete")}
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
