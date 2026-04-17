import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import type { Advance } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdvancesPage() {
  if (!hasSupabase) return <><ModuleHeader title="Advances" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("advances", session.orgId, { orderBy: "requested_at" });
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Advances" subtitle={`${rows.length} requests`}
        action={<Button href="/console/finance/advances/new">+ Request advance</Button>} />
      <div className="page-content">
        <DataTable<Advance>
          rows={rows}
          columns={[
            { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents, r.currency), className: "font-mono text-xs" },
            { key: "reason", header: "Reason", render: (r) => r.reason ?? "—" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "requested", header: "Requested", render: (r) => timeAgo(r.requested_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
