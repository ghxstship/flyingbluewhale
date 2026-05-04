import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  fulfilled: "success",
  cancelled: "muted",
  draft: "info",
  sent: "info",
  acknowledged: "info",
};

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("id,number,title,amount_cents,currency,status,created_at")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  const total = rows.reduce((s, r) => s + Number(r.amount_cents), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Vendor"
        title="Purchase Orders"
        subtitle={
          rows.length > 0
            ? `${rows.length} PO${rows.length === 1 ? "" : "s"} · ${formatMoney(total)} committed`
            : "POs issued to this vendor."
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
          emptyLabel="No Purchase Orders"
          emptyDescription="No POs have been issued to this vendor yet."
          columns={[
            {
              key: "number",
              header: "Number",
              render: (r) => r.number,
              accessor: (r) => r.number,
              mono: true,
              sortable: true,
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title, sortable: true },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount_cents",
              header: "Amount",
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
