import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function FabricationPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.production.fabrication.title", undefined, "Fabrication")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.fabrication.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("fabrication_orders", session.orgId, { orderBy: "created_at" });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.fabrication.eyebrow", undefined, "Production")}
        title={t("console.production.fabrication.ordersTitle", undefined, "Fabrication Orders")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.production.fabrication.orderSingular", undefined, "Order") : t("console.production.fabrication.orderPlural", undefined, "Orders")}`}
        action={
          <Button href="/console/production/fabrication/new" size="sm">
            {t("console.production.fabrication.newOrder", undefined, "+ New Order")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Tables<"fabrication_orders">>
          rows={rows}
          rowHref={(r) => `/console/production/fabrication/${r.id}`}
          emptyLabel={t("console.production.fabrication.emptyLabel", undefined, "No fabrication orders")}
          emptyDescription={t(
            "console.production.fabrication.emptyDescription",
            undefined,
            "Custom-build work that goes to the shop — runs status from open through complete.",
          )}
          emptyAction={
            <Button href="/console/production/fabrication/new" size="sm">
              {t("console.production.fabrication.newOrder", undefined, "+ New Order")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.production.fabrication.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "status",
              header: t("console.production.fabrication.col.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "due",
              header: t("console.production.fabrication.col.due", undefined, "Due"),
              render: (r) => formatDate(r.due_at, "medium"),
              className: "font-mono text-xs",
              accessor: (r) => r.due_at,
            },
          ]}
        />
      </div>
    </>
  );
}
