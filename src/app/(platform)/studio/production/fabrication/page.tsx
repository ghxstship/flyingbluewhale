import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
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
  // Exact count alongside the capped window (F-01) — subtitle + truncation
  // indicator stay honest past the 100-row cap.
  const { rows, totalCount } = await listOrgScopedWithCount("fabrication_orders", session.orgId, {
    orderBy: "created_at",
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.fabrication.eyebrow", undefined, "Production")}
        title={t("console.production.fabrication.ordersTitle", undefined, "Fabrication Orders")}
        subtitle={`${totalCount} ${totalCount === 1 ? t("console.production.fabrication.orderSingular", undefined, "Order") : t("console.production.fabrication.orderPlural", undefined, "Orders")}`}
        action={
          <Button href="/studio/production/fabrication/new" size="sm">
            {t("console.production.fabrication.newOrder", undefined, "+ New Order")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Tables<"fabrication_orders">>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/production/fabrication/${r.id}`}
          emptyLabel={t("console.production.fabrication.emptyLabel", undefined, "No fabrication orders")}
          emptyDescription={t(
            "console.production.fabrication.emptyDescription",
            undefined,
            "Custom-build work that goes to the shop. Runs status from open through complete.",
          )}
          emptyAction={
            <Button href="/studio/production/fabrication/new" size="sm">
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
              key: "production_phase",
              header: t("console.production.fabrication.col.production_phase", undefined, "Status"),
              render: (r) => <StatusBadge status={r.production_phase} />,
              accessor: (r) => r.production_phase,
              filterable: true,
              groupable: true,
            },
            {
              key: "due",
              header: t("console.production.fabrication.col.due", undefined, "Due"),
              render: (r) => formatDate(r.due_at, "medium"),
              mono: true,
              accessor: (r) => r.due_at,
            },
          ]}
        />
      </div>
    </>
  );
}
