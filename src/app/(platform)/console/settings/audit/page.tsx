import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { AuditLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (!hasSupabase) return <><ModuleHeader title="Audit log" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("audit_log", session.orgId, { orderBy: "at", limit: 200 });
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Audit log" subtitle={`Latest ${rows.length} events`} />
      <div className="page-content">
        <DataTable<AuditLog>
          rows={rows}
          emptyLabel="No audit events yet"
          columns={[
            { key: "action", header: "Action", render: (r) => <Badge variant="muted"><span className="font-mono">{r.action}</span></Badge> },
            { key: "target", header: "Target", render: (r) => <span className="font-mono text-xs">{r.target_table ?? "—"}{r.target_id ? `:${r.target_id.slice(0, 8)}` : ""}</span> },
            { key: "actor", header: "Actor", render: (r) => <span className="font-mono text-xs">{r.actor_id ? r.actor_id.slice(0, 8) : "system"}</span> },
            { key: "when", header: "When", render: (r) => timeAgo(r.at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
