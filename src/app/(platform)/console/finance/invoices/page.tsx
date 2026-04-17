import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import type { Invoice } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  if (!hasSupabase) {
    return <><ModuleHeader title="Invoices" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  }
  const session = await requireSession();
  const rows = await listOrgScoped("invoices", session.orgId, { orderBy: "created_at" });
  const outstanding = rows.filter((r) => ["sent", "overdue"].includes(r.status)).reduce((s, r) => s + r.amount_cents, 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Invoices"
        subtitle={`${rows.length} total · ${formatMoney(outstanding)} outstanding · ${formatMoney(paid)} paid`}
        action={<Button href="/console/finance/invoices/new">+ New invoice</Button>}
      />
      <div className="page-content">
        <DataTable<Invoice>
          rows={rows}
          rowHref={(r) => `/console/finance/invoices/${r.id}`}
          columns={[
            { key: "number", header: "Number", render: (r) => <span className="font-mono text-xs">{r.number}</span> },
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents, r.currency), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "due", header: "Due", render: (r) => r.due_at ?? "—", className: "font-mono text-xs" },
            { key: "created", header: "Created", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
