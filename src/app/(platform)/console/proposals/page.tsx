import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate, timeAgo } from "@/lib/format";
import type { Proposal } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  if (!hasSupabase) {
    return <><ModuleHeader title="Proposals" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  }
  const session = await requireSession();
  const rows = await listOrgScoped("proposals", session.orgId, { orderBy: "updated_at" });

  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="Proposals"
        subtitle={`${rows.length} proposal${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/proposals/new">+ New proposal</Button>}
      />
      <div className="page-content">
        <DataTable<Proposal>
          rows={rows}
          rowHref={(r) => `/console/proposals/${r.id}`}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents ?? 0), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "expires", header: "Expires", render: (r) => r.expires_at ? formatDate(r.expires_at) : "—", className: "font-mono text-xs" },
            { key: "updated", header: "Updated", render: (r) => timeAgo(r.updated_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
