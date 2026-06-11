import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  currency: string;
  po_state: string;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("id,number,title,amount_cents,currency,po_state,created_at")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  const total = rows.reduce((s, r) => s + Number(r.amount_cents), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.pos.eyebrow", undefined, "Vendor")}
        title={t("console.procurement.vendors.pos.title", undefined, "Purchase Orders")}
        subtitle={
          rows.length > 0
            ? t(
                "console.procurement.vendors.pos.subtitleCount",
                { count: rows.length, suffix: rows.length === 1 ? "" : "s", total: formatMoney(total) },
                `${rows.length} PO${rows.length === 1 ? "" : "s"} · ${formatMoney(total)} committed`,
              )
            : t("console.procurement.vendors.pos.subtitleEmpty", undefined, "POs issued to this vendor.")
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
          emptyLabel={t("console.procurement.vendors.pos.emptyLabel", undefined, "No Purchase Orders")}
          emptyDescription={t(
            "console.procurement.vendors.pos.emptyDescription",
            undefined,
            "No POs have been issued to this vendor yet.",
          )}
          columns={[
            {
              key: "number",
              header: t("console.procurement.vendors.pos.col.number", undefined, "Number"),
              render: (r) => r.number,
              accessor: (r) => r.number,
              mono: true,
              sortable: true,
            },
            {
              key: "title",
              header: t("console.procurement.vendors.pos.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
              sortable: true,
            },
            {
              key: "po_state",
              header: t("console.procurement.vendors.pos.col.po_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.po_state} />,
              accessor: (r) => r.po_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount_cents",
              header: t("console.procurement.vendors.pos.col.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents),
              accessor: (r) => r.amount_cents,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
