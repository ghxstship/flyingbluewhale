import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: unknown;
  at: string;
};

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id,actor_id,action,metadata,at")
    .eq("org_id", session.orgId)
    .eq("target_table", "invoices")
    .eq("target_id", invoiceId)
    .order("at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.invoices.activity.eyebrow", undefined, "Invoice")}
        title={t("console.finance.invoices.activity.title", undefined, "Activity")}
        subtitle={t("console.finance.invoices.activity.subtitle", undefined, "Audit trail for this invoice.")}
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          emptyLabel={t("console.finance.invoices.activity.emptyLabel", undefined, "No Activity Yet")}
          emptyDescription={t(
            "console.finance.invoices.activity.emptyDescription",
            undefined,
            "Audit log entries appear here as the invoice moves between statuses or is edited.",
          )}
          columns={[
            {
              key: "at",
              header: t("console.finance.invoices.activity.col.when", undefined, "When"),
              render: (r) => formatDate(r.at),
              accessor: (r) => r.at,
              mono: true,
              sortable: true,
            },
            {
              key: "action",
              header: t("console.finance.invoices.activity.col.action", undefined, "Action"),
              render: (r) => r.action,
              accessor: (r) => r.action,
              mono: true,
              filterable: true,
            },
            {
              key: "actor_id",
              header: t("console.finance.invoices.activity.col.actor", undefined, "Actor"),
              render: (r) => r.actor_id ?? "system",
              accessor: (r) => r.actor_id ?? "system",
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
