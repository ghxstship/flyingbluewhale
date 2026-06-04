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
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, number, title, amount_cents, status, issued_at, due_at")
    .eq("org_id", session.orgId)
    .eq("created_by", session.userId)
    .order("issued_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string;
    number: string | null;
    title: string | null;
    amount_cents: number;
    status: string;
    issued_at: string | null;
    due_at: string | null;
  }>;
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.invoices.title", undefined, "Invoices")}
      subtitle={t("p.vendor.invoices.subtitle", undefined, "Your invoices against this org")}
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t("p.vendor.invoices.empty.title", undefined, "No Invoices Yet")}
          description={t(
            "p.vendor.invoices.empty.description",
            undefined,
            "Submit an invoice through the console or API. Paid invoices route through Stripe Connect.",
          )}
        />
      ) : (
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.vendor.invoices.col.number", undefined, "#")}</th>
              <th>{t("p.vendor.invoices.col.title", undefined, "Title")}</th>
              <th>{t("p.vendor.invoices.col.amount", undefined, "Amount")}</th>
              <th>{t("p.vendor.invoices.col.status", undefined, "Status")}</th>
              <th>{t("p.vendor.invoices.col.issued", undefined, "Issued")}</th>
              <th>{t("p.vendor.invoices.col.due", undefined, "Due")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.number ?? r.id.slice(0, 8)}</td>
                <td>{r.title ?? "—"}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="font-mono text-xs">{fmtDate(r.issued_at)}</td>
                <td className="font-mono text-xs">{fmtDate(r.due_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
