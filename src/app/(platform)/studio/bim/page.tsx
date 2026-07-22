import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

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

function fmtBytes(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bim.eyebrow", undefined, "Creative")}
          title={t("console.bim.title", undefined, "BIM Models")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bim.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.bim.eyebrow", undefined, "Creative")}
        title={t("console.bim.title", undefined, "BIM Models")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.bim.modelSingular", undefined, "Model") : t("console.bim.modelPlural", undefined, "Models")} · ${readyCount} ${t("console.bim.ready", undefined, "Ready")} · ${processingCount} ${t("console.bim.processing", undefined, "Processing")} · ${failedCount} ${t("console.bim.failed", undefined, "Failed")}`}
        action={
          <Button href="/studio/bim/new" size="sm">
            {t("console.bim.registerModel", undefined, "+ Register Model")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label={t("console.bim.total", undefined, "Total")} value={fmt.number(rows.length)} accent />
          <MetricCard label={t("console.bim.ready", undefined, "Ready")} value={fmt.number(readyCount)} />
          <MetricCard
            label={t("console.bim.processing", undefined, "Processing")}
            value={fmt.number(processingCount)}
          />
          <MetricCard label={t("console.bim.failed", undefined, "Failed")} value={fmt.number(failedCount)} />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/bim/${r.id}`}
          emptyLabel={t("console.bim.emptyLabel", undefined, "No BIM models registered yet")}
          emptyDescription={t(
            "console.bim.emptyDescription",
            undefined,
            "Register IFC / RVT / NWD models per project. RVT and NWD route through Forge Model Derivative; IFC renders directly via web-ifc.",
          )}
          emptyAction={
            <Button href="/studio/bim/new" size="sm">
              {t("console.bim.registerModel", undefined, "+ Register Model")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.bim.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.bim.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "type",
              header: t("console.bim.columns.type", undefined, "Type"),
              render: (r) => <span className="uppercase">{r.source_type}</span>,
              mono: true,
              accessor: (r) => r.source_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "discipline",
              header: t("console.bim.columns.discipline", undefined, "Discipline"),
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "size",
              header: t("console.bim.columns.size", undefined, "Size"),
              render: (r) => fmtBytes(r.size_bytes),
              accessor: (r) => r.size_bytes,
              numeric: true,
            },
            {
              key: "version",
              header: t("console.bim.columns.version", undefined, "Version"),
              render: (r) => r.version_label ?? "—",
              accessor: (r) => r.version_label,
              mono: true,
            },
            {
              key: "state",
              header: t("console.bim.columns.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.model_state)}>{toTitle(r.model_state)}</Badge>,
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
