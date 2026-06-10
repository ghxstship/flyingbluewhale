export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("purchase_orders")
    .select("id, number, title, amount_cents, po_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{
    id: string;
    number: string;
    title: string;
    amount_cents: number;
    po_state: string;
    created_at: string;
  }>;
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.purchaseOrders.title", undefined, "Purchase Orders")}
      subtitle={t("p.vendor.purchaseOrders.subtitle", undefined, "Open + paid POs")}
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t("p.vendor.purchaseOrders.empty.title", undefined, "No Purchase Orders")}
          description={t(
            "p.vendor.purchaseOrders.empty.description",
            undefined,
            "POs routed to your vendor profile appear here. Ack a PO to move it forward.",
          )}
        />
      ) : (
        <table className="ps-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.vendor.purchaseOrders.col.number", undefined, "#")}</th>
              <th>{t("p.vendor.purchaseOrders.col.title", undefined, "Title")}</th>
              <th>{t("p.vendor.purchaseOrders.col.amount", undefined, "Amount")}</th>
              <th>{t("p.vendor.purchaseOrders.col.po_state", undefined, "Status")}</th>
              <th>{t("p.vendor.purchaseOrders.col.created", undefined, "Created")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.number}</td>
                <td>{r.title}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td>
                  <StatusBadge status={r.po_state} />
                </td>
                <td className="font-mono text-xs">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
