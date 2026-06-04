import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
};

const lineAmount = (r: { quantity: number; unit_price_cents: number }) =>
  Number(r.quantity) * Number(r.unit_price_cents);

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!hasSupabase) return null;
  await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoice_line_items")
    .select("id,description,quantity,unit_price_cents,position")
    .eq("invoice_id", invoiceId)
    .order("position", { ascending: true });
  const rows = (data ?? []) as Row[];

  const total = rows.reduce((s, r) => s + lineAmount(r), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.invoices.lineItems.eyebrow", undefined, "Invoice")}
        title={t("console.finance.invoices.lineItems.title", undefined, "Line Items")}
        subtitle={
          rows.length > 0
            ? t(
                "console.finance.invoices.lineItems.subtitleCount",
                {
                  count: rows.length,
                  lineLabel:
                    rows.length === 1
                      ? t("console.finance.invoices.lineItems.lineSingular", undefined, "line")
                      : t("console.finance.invoices.lineItems.linePlural", undefined, "lines"),
                  total: formatMoney(total),
                },
                `${rows.length} line${rows.length === 1 ? "" : "s"} · ${formatMoney(total)} total`,
              )
            : t("console.finance.invoices.lineItems.subtitleEmpty", undefined, "Itemized breakdown of this invoice.")
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.finance.invoices.lineItems.emptyLabel", undefined, "No Line Items")}
          emptyDescription={t(
            "console.finance.invoices.lineItems.emptyDescription",
            undefined,
            "This invoice has no line items. Edit the invoice to add itemized lines.",
          )}
          columns={[
            {
              key: "description",
              header: t("console.finance.invoices.lineItems.columns.description", undefined, "Description"),
              render: (r) => r.description,
              accessor: (r) => r.description,
            },
            {
              key: "quantity",
              header: t("console.finance.invoices.lineItems.columns.qty", undefined, "Qty"),
              render: (r) => r.quantity,
              accessor: (r) => r.quantity,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "unit_price_cents",
              header: t("console.finance.invoices.lineItems.columns.unitPrice", undefined, "Unit Price"),
              render: (r) => (r.unit_price_cents != null ? formatMoney(r.unit_price_cents) : "—"),
              accessor: (r) => r.unit_price_cents ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "amount",
              header: t("console.finance.invoices.lineItems.columns.amount", undefined, "Amount"),
              render: (r) => formatMoney(lineAmount(r)),
              accessor: (r) => lineAmount(r),
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
