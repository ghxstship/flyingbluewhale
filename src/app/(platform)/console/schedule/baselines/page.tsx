import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type BaselineState = "draft" | "active" | "archived";

type Row = {
  id: string;
  name: string;
  description: string | null;
  baseline_state: BaselineState;
  imported_from: string | null;
  imported_at: string | null;
  snapshot_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
  activity_count: number;
};

const STATE_TONE: Record<BaselineState, "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  active: "success",
  archived: "info",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="Schedule Baselines" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("schedule_baselines")
    .select(
      "id, name, description, baseline_state, imported_from, imported_at, snapshot_at, created_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const baseRows = (data ?? []) as unknown as Omit<Row, "activity_count">[];

  // Hydrate activity counts per baseline (one round-trip).
  const ids = baseRows.map((r) => r.id);
  const activityCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: acts } = await supabase.from("schedule_activities").select("baseline_id").in("baseline_id", ids);
    for (const a of (acts ?? []) as { baseline_id: string }[]) {
      activityCounts[a.baseline_id] = (activityCounts[a.baseline_id] ?? 0) + 1;
    }
  }
  const rows: Row[] = baseRows.map((r) => ({ ...r, activity_count: activityCounts[r.id] ?? 0 }));

  const activeCount = rows.filter((r) => r.baseline_state === "active").length;
  const draftCount = rows.filter((r) => r.baseline_state === "draft").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Schedule Baselines"
        subtitle={`${rows.length} Baseline${rows.length === 1 ? "" : "s"} · ${activeCount} Active · ${draftCount} Draft`}
        action={
          <Button href="/console/schedule/baselines/new" size="sm">
            + New Baseline
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total" value={fmt.number(rows.length)} accent />
          <MetricCard label="Active" value={fmt.number(activeCount)} />
          <MetricCard label="Draft" value={fmt.number(draftCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/schedule/baselines/${r.id}`}
          emptyLabel="No schedule baselines yet"
          emptyDescription="A baseline is a named snapshot of the project schedule. Import from P6/MSP/Asta XER or XML, or build natively."
          emptyAction={
            <Button href="/console/schedule/baselines/new" size="sm">
              + New Baseline
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "activities",
              header: "Activities",
              render: (r) => fmt.number(r.activity_count),
              accessor: (r) => r.activity_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "source",
              header: "Source",
              render: (r) => r.imported_from ?? "Native",
              accessor: (r) => r.imported_from ?? "native",
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.baseline_state]}>{toTitle(r.baseline_state)}</Badge>,
              accessor: (r) => r.baseline_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
