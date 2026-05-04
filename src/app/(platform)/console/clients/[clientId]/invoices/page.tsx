import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  status: string;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  paid: "success",
  overdue: "error",
  voided: "muted",
  draft: "info",
  sent: "info",
};

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id,number,title,amount_cents,status,issued_at,due_at,paid_at")
    .eq("org_id", session.orgId)
    .eq("client_id", clientId)
    .order("issued_at", { ascending: false, nullsFirst: false });
  const rows = (data ?? []) as Row[];

  const total = rows.reduce((s, r) => s + Number(r.amount_cents), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount_cents), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Client"
        title="Invoices"
        subtitle={
          rows.length > 0
            ? `${formatMoney(paid)} paid · ${formatMoney(total - paid)} outstanding`
            : "Invoices issued to this client."
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/invoices/${r.id}`}
          emptyLabel="No Invoices"
          emptyDescription="No invoices issued to this client yet."
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
              key: "issued_at",
              header: "Issued",
              render: (r) => (r.issued_at ? formatDate(r.issued_at) : "—"),
              accessor: (r) => r.issued_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "due_at",
              header: "Due",
              render: (r) => (r.due_at ? formatDate(r.due_at) : "—"),
              accessor: (r) => r.due_at ?? "",
              mono: true,
              sortable: true,
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
