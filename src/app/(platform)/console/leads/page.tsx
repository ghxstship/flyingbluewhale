import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  if (!hasSupabase) {
    return <><ModuleHeader title="Leads" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  }
  const session = await requireSession();
  const rows = await listOrgScoped("leads", session.orgId, { orderBy: "updated_at" });

  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="Leads"
        subtitle={`${rows.length} lead${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/leads/new">+ New lead</Button>}
      />
      <div className="page-content">
        <DataTable<Lead>
          rows={rows}
          rowHref={(r) => `/console/leads/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "stage", header: "Stage", render: (r) => <StatusBadge status={r.stage} /> },
            { key: "value", header: "Value", render: (r) => formatMoney(r.estimated_value_cents), className: "font-mono text-xs" },
            { key: "source", header: "Source", render: (r) => r.source ?? "—", className: "font-mono text-xs" },
            { key: "email", header: "Email", render: (r) => r.email ?? "—", className: "font-mono text-xs" },
            { key: "updated", header: "Updated", render: (r) => timeAgo(r.updated_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
