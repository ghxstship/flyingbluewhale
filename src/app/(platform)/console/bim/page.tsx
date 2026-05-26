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

type ModelState = "uploaded" | "processing" | "ready" | "failed" | "archived";
type SourceType = "ifc" | "ifc_zip" | "rvt" | "nwd" | "nwc" | "glb" | "gltf" | "fbx" | "dwg";

type Row = {
  id: string;
  name: string;
  discipline: string | null;
  source_type: SourceType;
  size_bytes: number | null;
  version_label: string | null;
  model_state: ModelState;
  uploaded_at: string;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<ModelState, "muted" | "info" | "warning" | "success" | "error"> = {
  uploaded: "info",
  processing: "warning",
  ready: "success",
  failed: "error",
  archived: "muted",
};

function fmtBytes(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Creative" title="BIM Models" />
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
    .from("bim_models")
    .select(
      "id, name, discipline, source_type, size_bytes, version_label, model_state, uploaded_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const readyCount = rows.filter((r) => r.model_state === "ready").length;
  const processingCount = rows.filter((r) => r.model_state === "processing").length;
  const failedCount = rows.filter((r) => r.model_state === "failed").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Creative"
        title="BIM Models"
        subtitle={`${rows.length} Model${rows.length === 1 ? "" : "s"} · ${readyCount} Ready · ${processingCount} Processing · ${failedCount} Failed`}
        action={
          <Button href="/console/bim/new" size="sm">
            + Register Model
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total" value={fmt.number(rows.length)} accent />
          <MetricCard label="Ready" value={fmt.number(readyCount)} />
          <MetricCard label="Processing" value={fmt.number(processingCount)} />
          <MetricCard label="Failed" value={fmt.number(failedCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/bim/${r.id}`}
          emptyLabel="No BIM models registered yet"
          emptyDescription="Register IFC / RVT / NWD models per project. RVT and NWD route through Forge Model Derivative; IFC renders directly via web-ifc."
          emptyAction={
            <Button href="/console/bim/new" size="sm">
              + Register Model
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
              key: "type",
              header: "Type",
              render: (r) => <span className="font-mono text-xs uppercase">{r.source_type}</span>,
              accessor: (r) => r.source_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "size",
              header: "Size",
              render: (r) => fmtBytes(r.size_bytes),
              accessor: (r) => r.size_bytes,
              className: "font-mono text-xs text-right",
            },
            {
              key: "version",
              header: "Version",
              render: (r) => r.version_label ?? "—",
              accessor: (r) => r.version_label,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.model_state]}>{toTitle(r.model_state)}</Badge>,
              accessor: (r) => r.model_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
