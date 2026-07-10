import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ReceiptRow = {
  id: string;
  po_id: string;
  receipt_number: string;
  received_at: string;
  partial: boolean;
  notes: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.receiving.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.receiving.title", undefined, "Receiving")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.receiving.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: receiptData } = await supabase
    .from("goods_receipts")
    .select("id, po_id, receipt_number, received_at, partial, notes")
    .eq("org_id", session.orgId)
    .order("received_at", { ascending: false })
    .limit(100);
  const receipts = (receiptData ?? []) as ReceiptRow[];

  // Hydrate PO number/title for each receipt. PurchaseOrders are org-scoped,
  // so a single fetch → Map avoids an N+1 join.
  const { data: poData } = await supabase
    .from("purchase_orders")
    .select("id, number, title")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(1000);
  const poById = new Map((poData ?? []).map((p) => [p.id, p as { id: string; number: string; title: string }]));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.receiving.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.receiving.title", undefined, "Receiving")}
        subtitle={t(
          "console.procurement.receiving.subtitle",
          { count: receipts.length },
          `${receipts.length} goods receipts · 3-way match`,
        )}
        action={
          <Button href="/studio/procurement/receiving/new" size="sm">
            {t("console.procurement.receiving.newReceipt", undefined, "+ New receipt")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<ReceiptRow>
          rows={receipts}
          rowHref={(r) => `/studio/procurement/receiving/${r.id}`}
          emptyLabel={t("console.procurement.receiving.emptyLabel", undefined, "No goods receipts yet")}
          emptyDescription={t(
            "console.procurement.receiving.emptyDescription",
            undefined,
            "Record a goods receipt against a purchase order to start the 3-way match.",
          )}
          columns={[
            {
              key: "receipt_number",
              header: t("console.procurement.receiving.columns.receipt", undefined, "Receipt #"),
              render: (r) => r.receipt_number,
              mono: true,
            },
            {
              key: "po_id",
              header: t("console.procurement.receiving.columns.po", undefined, "Purchase Order"),
              render: (r) => {
                const po = poById.get(r.po_id);
                return po ? `${po.number} · ${po.title}` : "—";
              },
            },
            {
              key: "received_at",
              header: t("console.procurement.receiving.columns.receivedAt", undefined, "Received"),
              render: (r) => fmt.date(new Date(r.received_at)),
              mono: true,
            },
            {
              key: "partial",
              header: t("console.procurement.receiving.columns.partial", undefined, "Partial"),
              render: (r) =>
                r.partial ? (
                  <Badge variant="warning">
                    {t("console.procurement.receiving.partialYes", undefined, "Partial")}
                  </Badge>
                ) : (
                  <Badge variant="success">{t("console.procurement.receiving.partialNo", undefined, "Complete")}</Badge>
                ),
            },
            {
              key: "notes",
              header: t("console.procurement.receiving.columns.notes", undefined, "Notes"),
              render: (r) => r.notes ?? "—",
            },
          ]}
        />
      </div>
    </>
  );
}
