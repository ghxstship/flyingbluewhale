import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  project_id: string | null;
};

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id,description,started_at,ended_at,duration_minutes,billable,project_id")
    .eq("org_id", session.orgId)
    .eq("user_id", personId)
    .order("started_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];

  const totalMinutes = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const billableMinutes = rows.filter((r) => r.billable).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Person"
        title="Time"
        subtitle={
          rows.length > 0
            ? `${(totalMinutes / 60).toFixed(1)}h logged · ${(billableMinutes / 60).toFixed(1)}h billable (last 100 entries)`
            : "Time entries logged against this person."
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Time Entries"
          emptyDescription="This person has no logged time. Time entries are recorded against projects from the Time module."
          columns={[
            {
              key: "started_at",
              header: "Started",
              render: (r) => formatDate(r.started_at),
              accessor: (r) => r.started_at,
              mono: true,
              sortable: true,
            },
            {
              key: "description",
              header: "Description",
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? "",
            },
            {
              key: "duration",
              header: "Duration",
              render: (r) => (r.duration_minutes != null ? `${(r.duration_minutes / 60).toFixed(2)}h` : "—"),
              accessor: (r) => r.duration_minutes ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "billable",
              header: "Billable",
              render: (r) => (r.billable ? "Yes" : "—"),
              accessor: (r) => (r.billable ? "yes" : "no"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
