import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Invoice } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.finance.invoices.title", undefined, "Invoices")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.invoices.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("invoices", session.orgId, { orderBy: "created_at" });
  const outstanding = rows
    .filter((r) => ["sent", "overdue"].includes(r.status))
    .reduce((s, r) => s + r.amount_cents, 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.invoices.title", undefined, "Invoices")}
        subtitle={t(
          "console.finance.invoices.subtitle",
          { count: rows.length, outstanding: formatMoney(outstanding), paid: formatMoney(paid) },
          `${rows.length} Total · ${formatMoney(outstanding)} outstanding · ${formatMoney(paid)} paid`,
        )}
        action={
          <Button href="/console/finance/invoices/new">
            {t("console.finance.invoices.new", undefined, "+ New Invoice")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Invoice>
          rows={rows}
          rowHref={(r) => `/console/finance/invoices/${r.id}`}
          columns={[
            {
              key: "number",
              header: t("console.finance.invoices.columns.number", undefined, "Number"),
              render: (r) => <span className="font-mono text-xs">{r.number}</span>,
              accessor: (r) => r.number ?? null,
            },
            {
              key: "title",
              header: t("console.finance.invoices.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "amount",
              header: t("console.finance.invoices.columns.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents, r.currency),
              className: "font-mono text-xs",
              accessor: (r) => r.amount_cents ?? null,
            },
            {
              key: "status",
              header: t("console.finance.invoices.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "due",
              header: t("console.finance.invoices.columns.due", undefined, "Due"),
              render: (r) => r.due_at ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.due_at ?? null,
            },
            {
              key: "created",
              header: t("console.finance.invoices.columns.created", undefined, "Created"),
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
