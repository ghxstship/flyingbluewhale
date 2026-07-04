export const dynamic = "force-dynamic";

import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { RecordActionButton } from "@/components/RecordActionButton";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { convertRequisitionToPoAction, convertRequisitionToRfqAction } from "../actions";
import { deleteRequisition } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, project_id, requisition_state, created_at")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.procurement.requisitions.detail.eyebrow", undefined, "Procurement")}
      title={(r) => r.title ?? t("console.procurement.requisitions.detail.fallbackTitle", undefined, "Requisition")}
      subtitle={(r) => `${money(r.estimated_cents)}`}
      breadcrumbs={[
        { label: t("console.procurement.requisitions.detail.breadcrumbProcurement", undefined, "Procurement") },
        {
          label: t("console.procurement.requisitions.detail.breadcrumbRequisitions", undefined, "Requisitions"),
          href: "/studio/procurement/requisitions",
        },
        { label: row?.title ?? t("console.procurement.requisitions.detail.fallbackTitle", undefined, "Requisition") },
      ]}
      fields={
        row
          ? [
              {
                label: t("console.procurement.requisitions.detail.fieldState", undefined, "Status"),
                value: toTitle(row.requisition_state),
              },
              {
                label: t("console.procurement.requisitions.detail.fieldEstimated", undefined, "Estimated"),
                value: money(row.estimated_cents),
              },
              {
                label: t("console.procurement.requisitions.detail.fieldDescription", undefined, "Description"),
                value: row.description ?? "—",
              },
              {
                label: t("console.procurement.requisitions.detail.fieldCreated", undefined, "Created"),
                value: fmtDate(row.created_at),
              },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            {isManagerPlus(session) && row.requisition_state === "approved" && (
              <RecordActionButton
                action={convertRequisitionToPoAction.bind(null, reqId)}
                label={t("console.procurement.requisitions.detail.convertToPo", undefined, "Convert To PO")}
                pendingLabel={t("console.procurement.requisitions.detail.converting", undefined, "Converting…")}
              />
            )}
            {isManagerPlus(session) &&
              (row.requisition_state === "submitted" || row.requisition_state === "approved") && (
                <RecordActionButton
                  action={convertRequisitionToRfqAction.bind(null, reqId)}
                  label={t("console.procurement.requisitions.detail.convertToRfq", undefined, "Convert To RFQ")}
                  pendingLabel={t("console.procurement.requisitions.detail.converting", undefined, "Converting…")}
                  variant="secondary"
                />
              )}
            <Button href={`/studio/procurement/requisitions/${reqId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteRequisition.bind(null, reqId)}
              confirm={t(
                "console.procurement.requisitions.detail.deleteConfirm",
                {
                  title: row.title ?? t("console.procurement.requisitions.detail.thisRecord", undefined, "this record"),
                },
                `Delete requisition "${row.title ?? "this record"}"? This cannot be undone.`,
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
