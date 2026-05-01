import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  status: string;
  scheduled_for: string | null;
  project: { name: string | null } | null;
  inspector: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "info",
  in_progress: "warning",
  passed: "success",
  failed: "error",
  cancelled: "muted",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Inspections" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspections")
    .select(
      "id, code, name, category, status, scheduled_for, project:project_id(name), inspector:inspector_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status === "scheduled" || r.status === "in_progress").length;
  const passed30 = rows.filter((r) => r.status === "passed").length;
  const failed30 = rows.filter((r) => r.status === "failed").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Inspections"
        subtitle="Template-driven checklists — rigging, fire, electrical, ADA, food safety, security."
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/inspections/templates" size="sm" variant="ghost">
              Templates
            </Button>
            <Button href="/console/inspections/new" size="sm">
              + New inspection
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} accent />
          <MetricCard label="Passed" value={passed30.toLocaleString()} />
          <MetricCard label="Failed" value={failed30.toLocaleString()} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/inspections/${r.id}`}
          emptyLabel="No inspections yet"
          emptyDescription="Inspections are checklist-driven. Define a template, then schedule instances per project or venue."
          emptyAction={
            <Button href="/console/inspections/templates/new" size="sm">
              + Create first template
            </Button>
          }
          columns={[
            { key: "code", header: "Code", render: (r) => r.code, className: "font-mono text-xs" },
            { key: "name", header: "Inspection", render: (r) => r.name },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            {
              key: "scheduled",
              header: "Scheduled",
              render: (r) => fmt(r.scheduled_for),
              className: "font-mono text-xs",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace("_", " ")}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
