import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { countOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Requisition } from "@/lib/supabase/types";
import { bulkApproveRequisitions, bulkRejectRequisitions } from "./actions";

export const dynamic = "force-dynamic";

export default async function RequisitionsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.procurement.requisitions.title", undefined, "Requisitions")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.requisitions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  // Exact count alongside the capped table page (audit A-05/A-07) — the
  // subtitle and truncation indicator stay honest past the 100-row cap.
  const [rows, totalCount] = await Promise.all([
    listOrgScoped("requisitions", session.orgId, { orderBy: "created_at" }),
    countOrgScoped("requisitions", session.orgId),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.requisitions.eyebrow", undefined, "Procurement · Source")}
        title={t("console.procurement.requisitions.title", undefined, "Requisitions")}
        subtitle={t("console.procurement.requisitions.subtitle", { count: totalCount }, `${totalCount} Requests`)}
        action={
          <Button href="/studio/procurement/requisitions/new">
            {t("console.procurement.requisitions.newRequest", undefined, "+ New Request")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Requisition>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/procurement/requisitions/${r.id}`}
          bulkActions={[
            {
              id: "approve",
              label: t("console.procurement.requisitions.bulk.approve", undefined, "Approve"),
              perform: bulkApproveRequisitions,
            },
            {
              id: "reject",
              label: t("console.procurement.requisitions.bulk.reject", undefined, "Reject"),
              variant: "danger",
              perform: bulkRejectRequisitions,
            },
          ]}
          emptyLabel={t("console.procurement.requisitions.emptyLabel", undefined, "No requisitions")}
          emptyDescription={t(
            "console.procurement.requisitions.emptyDescription",
            undefined,
            "Submit a request to spend; once approved, it converts to a purchase order.",
          )}
          emptyAction={
            <Button href="/studio/procurement/requisitions/new" size="sm">
              {t("console.procurement.requisitions.newRequest", undefined, "+ New Request")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.procurement.requisitions.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "estimated",
              header: t("console.procurement.requisitions.col.estimated", undefined, "Estimated"),
              render: (r) => formatMoney(r.estimated_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.estimated_cents ?? 0),
            },
            {
              key: "requisition_state",
              header: t("console.procurement.requisitions.col.requisition_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.requisition_state} />,
              accessor: (r) => r.requisition_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "created",
              header: t("console.procurement.requisitions.col.created", undefined, "Created"),
              render: (r) => timeAgo(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
