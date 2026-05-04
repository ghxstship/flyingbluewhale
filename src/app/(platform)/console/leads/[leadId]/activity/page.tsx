import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: unknown;
  at: string;
};

export default async function Page({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id,actor_id,action,metadata,at")
    .eq("org_id", session.orgId)
    .eq("target_table", "leads")
    .eq("target_id", leadId)
    .order("at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader eyebrow="Lead" title="Activity" subtitle="Audit trail for this lead." />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Activity Yet"
          emptyDescription="Audit log entries appear here as the lead moves through stages or is edited."
          columns={[
            {
              key: "at",
              header: "When",
              render: (r) => formatDate(r.at),
              accessor: (r) => r.at,
              mono: true,
              sortable: true,
            },
            {
              key: "action",
              header: "Action",
              render: (r) => r.action,
              accessor: (r) => r.action,
              mono: true,
              filterable: true,
            },
            {
              key: "actor_id",
              header: "Actor",
              render: (r) => r.actor_id ?? "system",
              accessor: (r) => r.actor_id ?? "system",
              mono: true,
            },
          ]}
        />
      </div>
    </>
  );
}
