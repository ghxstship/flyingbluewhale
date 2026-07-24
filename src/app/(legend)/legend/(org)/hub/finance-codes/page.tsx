import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import { AppOwnershipChip } from "@/components/legend/AppOwnershipChip";
import { appForDeptCode, isDepartmentApp, type DepartmentApp } from "@/lib/xpms/app-ownership";

export const dynamic = "force-dynamic";

/**
 * Finance Codes pillar (canonical home, decision 6 rider): the org's cost
 * centers on the XPMS department canon (0000 Executive through 9000
 * Technology). Full CRUD lives here — cost_centers has no console surface;
 * finance WORKFLOWS (budgets, requisitions) stay in the console and code
 * against these.
 */

type CostCenter = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  parent_id: string | null;
};

export default async function FinanceCodesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.financeCodes.title", undefined, "Finance Codes")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data }, { data: dimRows }] = await Promise.all([
    db
      .from("cost_centers")
      .select("id, code, name, active, parent_id")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(300),
    // App-canon consumption v1: dim_department.app badges each cost center
    // with its owning app (sub-codes roll up to their thousand-class).
    db.from("dim_department").select("code, app"),
  ]);
  const rows = (data ?? []) as CostCenter[];
  const appByCode = new Map<string, DepartmentApp>();
  for (const d of (dimRows ?? []) as { code: string; app: string }[]) {
    if (isDepartmentApp(d.app)) appByCode.set(d.code, d.app);
  }
  const appOf = (code: string): DepartmentApp | null =>
    (/^\d/.test(code) ? appByCode.get(`${code[0]}000`) : null) ?? appForDeptCode(code);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.financeCodes.title", undefined, "Finance Codes")}
        subtitle={t(
          "console.legend.hub.financeCodes.subtitle",
          undefined,
          "Cost centers on the XPMS department canon. Every budget line and requisition codes against these.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.financeCodes.title", undefined, "Finance Codes") },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={urlFor("platform", "/finance")} size="sm" variant="secondary">
              {t("console.legend.hub.financeCodes.financeInConsole", undefined, "Finance in console")}
            </Button>
            <Button href="/legend/hub/finance-codes/new" size="sm">
              {t("console.legend.hub.financeCodes.newCostCenter", undefined, "+ New Cost Center")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.legend.hub.financeCodes.emptyTitle", undefined, "No cost centers yet")}
            description={t(
              "console.legend.hub.financeCodes.emptyDescription",
              undefined,
              "New organizations start with the 10 XPMS department classes, 0000 Executive through 9000 Technology.",
            )}
            action={
              <Button href="/legend/hub/finance-codes/new">
                {t("console.legend.hub.financeCodes.newCostCenter", undefined, "+ New Cost Center")}
              </Button>
            }
          />
        ) : (
          <DataView<CostCenter>
            rows={rows}
            rowHref={(c) => `/legend/hub/finance-codes/${c.id}`}
            emptyLabel={t("console.legend.hub.financeCodes.emptyLabel", undefined, "No cost centers")}
            columns={[
              {
                key: "code",
                header: t("console.legend.hub.financeCodes.columns.code", undefined, "Code"),
                render: (c) => <span className="ps-id">{c.code}</span>,
                accessor: (c) => c.code,
              },
              {
                key: "name",
                header: t("console.legend.hub.financeCodes.columns.name", undefined, "Name"),
                render: (c) => c.name,
                accessor: (c) => c.name,
              },
              {
                key: "app",
                header: t("console.legend.hub.financeCodes.columns.app", undefined, "App"),
                render: (c) => {
                  const app = appOf(c.code);
                  return app ? <AppOwnershipChip app={app} title={c.code} /> : <>—</>;
                },
                accessor: (c) => appOf(c.code) ?? "",
              },
              {
                key: "active",
                header: t("console.legend.hub.financeCodes.columns.status", undefined, "Status"),
                render: (c) =>
                  c.active ? (
                    <Badge variant="success">{t("console.legend.hub.financeCodes.active", undefined, "Active")}</Badge>
                  ) : (
                    <Badge variant="muted">{t("console.legend.hub.financeCodes.inactive", undefined, "Inactive")}</Badge>
                  ),
                accessor: (c) => (c.active ? "active" : "inactive"),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
