import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type CaptureState = "pending_upload" | "processing" | "ready" | "failed" | "archived";
type Source =
  | "openspace"
  | "dronedeploy"
  | "structionsite"
  | "matterport"
  | "huddle_cam"
  | "manual_360"
  | "drone_photo"
  | "satellite";

type Row = {
  id: string;
  name: string;
  source: Source;
  external_url: string | null;
  capture_date: string | null;
  capture_state: CaptureState;
  panorama_count: number | null;
  approximate_sqft: number | null;
  uploaded_at: string;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<CaptureState, "muted" | "info" | "warning" | "success" | "error"> = {
  pending_upload: "muted",
  processing: "warning",
  ready: "success",
  failed: "error",
  archived: "muted",
};

const SOURCE_LABEL: Record<Source, string> = {
  openspace: "OpenSpace",
  dronedeploy: "DroneDeploy",
  structionsite: "StructionSite",
  matterport: "Matterport",
  huddle_cam: "HuddleCam",
  manual_360: "Manual 360°",
  drone_photo: "Drone Photo",
  satellite: "Satellite",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.captures.eyebrow", undefined, "Field")}
          title={t("console.captures.title", undefined, "Reality Captures")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.captures.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("reality_captures")
    .select(
      "id, name, source, external_url, capture_date, capture_state, panorama_count, approximate_sqft, uploaded_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const readyCount = rows.filter((r) => r.capture_state === "ready").length;
  const processingCount = rows.filter((r) => r.capture_state === "processing").length;
  const totalPanos = rows.reduce((s, r) => s + Number(r.panorama_count ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.captures.eyebrow", undefined, "Field")}
        title={t("console.captures.title", undefined, "Reality Captures")}
        subtitle={t(
          "console.captures.subtitle",
          { count: rows.length, ready: readyCount, processing: processingCount, panos: fmt.number(totalPanos) },
          `${rows.length} captures · ${readyCount} ready · ${processingCount} processing · ${fmt.number(totalPanos)} panoramas`,
        )}
        action={
          <Button href="/console/captures/new" size="sm">
            {t("console.captures.registerCapture", undefined, "+ Register Capture")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.captures.metrics.total", undefined, "Total")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard label={t("console.captures.metrics.ready", undefined, "Ready")} value={fmt.number(readyCount)} />
          <MetricCard
            label={t("console.captures.metrics.processing", undefined, "Processing")}
            value={fmt.number(processingCount)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/captures/${r.id}`}
          emptyLabel={t("console.captures.emptyLabel", undefined, "No captures registered yet")}
          emptyDescription={t(
            "console.captures.emptyDescription",
            undefined,
            "Register OpenSpace / DroneDeploy / Matterport / 360° walks. Heavy assets live with the partner; rows here anchor them to projects + sheets for cross-ref.",
          )}
          emptyAction={
            <Button href="/console/captures/new" size="sm">
              {t("console.captures.registerCapture", undefined, "+ Register Capture")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.captures.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.captures.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "source",
              header: t("console.captures.columns.source", undefined, "Source"),
              render: (r) => SOURCE_LABEL[r.source],
              accessor: (r) => r.source,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "date",
              header: t("console.captures.columns.captured", undefined, "Captured"),
              render: (r) =>
                r.capture_date
                  ? fmt.dateParts(r.capture_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" })
                  : "—",
              accessor: (r) => r.capture_date,
              className: "font-mono text-xs",
            },
            {
              key: "panos",
              header: t("console.captures.columns.panos", undefined, "Panos"),
              render: (r) => (r.panorama_count != null ? fmt.number(r.panorama_count) : "—"),
              accessor: (r) => r.panorama_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "sqft",
              header: t("console.captures.columns.sqft", undefined, "Sq Ft"),
              render: (r) => (r.approximate_sqft != null ? fmt.number(r.approximate_sqft) : "—"),
              accessor: (r) => r.approximate_sqft,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.captures.columns.state", undefined, "State"),
              render: (r) => <Badge variant={STATE_TONE[r.capture_state]}>{toTitle(r.capture_state)}</Badge>,
              accessor: (r) => r.capture_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
