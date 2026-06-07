import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { CommitteeForm, PolicyForm } from "./Forms";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.governance.eyebrow", undefined, "Settings")}
          title={t("console.settings.governance.title", undefined, "Governance")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.governance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: committees }, { data: policies }] = await Promise.all([
    supabase
      .from("governance_committees")
      .select("id, name, cadence, charter, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("governance_policies")
      .select("id, name, category, status, effective_at, next_review_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.governance.eyebrow", undefined, "Settings")}
        title={t("console.settings.governance.workspaceTitle", undefined, "Workspace Settings")}
        subtitle={t("console.settings.governance.subtitle", undefined, "Governance")}
      />
      <div className="page-content max-w-4xl space-y-6">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.settings.governance.committees", undefined, "Committees")}
            </h3>
            <CommitteeForm />
          </div>
          <table className="ps-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.governance.columns.name", undefined, "Name")}</th>
                <th>{t("console.settings.governance.columns.cadence", undefined, "Cadence")}</th>
                <th>{t("console.settings.governance.columns.charter", undefined, "Charter")}</th>
              </tr>
            </thead>
            <tbody>
              {(committees ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[var(--p-text-2)]">
                    {t("console.settings.governance.emptyCommittees", undefined, "No committees yet.")}
                  </td>
                </tr>
              ) : (
                (committees ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="text-xs text-[var(--p-text-2)]">{c.cadence ? toTitle(c.cadence) : "—"}</td>
                    <td className="text-xs text-[var(--p-text-2)]">{c.charter ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.settings.governance.policies", undefined, "Policies")}
            </h3>
            <PolicyForm />
          </div>
          <table className="ps-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.governance.columns.name", undefined, "Name")}</th>
                <th>{t("console.settings.governance.columns.category", undefined, "Category")}</th>
                <th>{t("console.settings.governance.columns.status", undefined, "Status")}</th>
                <th>{t("console.settings.governance.columns.nextReview", undefined, "Next review")}</th>
              </tr>
            </thead>
            <tbody>
              {(policies ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--p-text-2)]">
                    {t("console.settings.governance.emptyPolicies", undefined, "No policies yet.")}
                  </td>
                </tr>
              ) : (
                (policies ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="text-xs text-[var(--p-text-2)]">{p.category ? toTitle(p.category) : "—"}</td>
                    <td>
                      <Badge variant={p.status === "active" ? "success" : "muted"}>{toTitle(p.status)}</Badge>
                    </td>
                    <td className="font-mono text-xs">
                      {p.next_review_at ? new Date(p.next_review_at).toLocaleDateString() : "—"}
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
