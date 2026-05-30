import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  phase: string;
  applicant_count: number;
  created_at: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Hiring" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_positions")
    .select("id, title, department, location, employment_type, phase, applicant_count, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Hiring"
        subtitle={`${rows.length} position${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/workforce/hiring/new" size="sm">
            + New Position
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/hiring/${r.id}`}
          emptyLabel="No positions yet"
          emptyDescription="Create a job position to start tracking applicants."
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            {
              key: "department",
              header: "Department",
              render: (r) => r.department ?? "—",
            },
            {
              key: "employment_type",
              header: "Type",
              render: (r) =>
                r.employment_type ? (
                  <Badge variant="muted">{r.employment_type.replace("_", " ")}</Badge>
                ) : (
                  <span>—</span>
                ),
            },
            {
              key: "phase",
              header: "Phase",
              render: (r) => (
                <Badge variant={r.phase === "open" ? "success" : r.phase === "filled" ? "info" : "muted"}>
                  {r.phase}
                </Badge>
              ),
            },
            {
              key: "applicant_count",
              header: "Applicants",
              render: (r) => r.applicant_count ?? 0,
            },
          ]}
        />
      </div>
    </>
  );
}
