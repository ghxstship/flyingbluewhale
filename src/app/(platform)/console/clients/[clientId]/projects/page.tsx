import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
};

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id,name,status,start_date,end_date,budget_cents")
    .eq("org_id", session.orgId)
    .eq("client_id", clientId)
    .order("start_date", { ascending: false, nullsFirst: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader eyebrow="Client" title="Projects" subtitle="Projects linked to this client." />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/projects/${r.id}`}
          emptyLabel="No Projects"
          emptyDescription="No projects link to this client yet."
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name, sortable: true },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={r.status === "active" ? "success" : "muted"}>{r.status}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "start_date",
              header: "Start",
              render: (r) => r.start_date ?? "—",
              accessor: (r) => r.start_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "end_date",
              header: "End",
              render: (r) => r.end_date ?? "—",
              accessor: (r) => r.end_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "budget_cents",
              header: "Budget",
              render: (r) => (r.budget_cents != null ? formatMoney(r.budget_cents) : "—"),
              accessor: (r) => r.budget_cents ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
