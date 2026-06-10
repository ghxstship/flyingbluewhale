import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  inspection_state: string;
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.inspections.eyebrow", undefined, "Safety")}
          title={t("console.inspections.title", undefined, "Inspections")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.inspections.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("inspections")
    .select(
      "id, code, name, category, inspection_state, scheduled_for, project:project_id(name), inspector:inspector_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.inspection_state === "scheduled" || r.inspection_state === "in_progress").length;
  const passed30 = rows.filter((r) => r.inspection_state === "passed").length;
  const failed30 = rows.filter((r) => r.inspection_state === "failed").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.eyebrow", undefined, "Safety")}
        title={t("console.inspections.title", undefined, "Inspections")}
        subtitle={t("console.inspections.subtitle", undefined, "Template-driven safety + compliance checklists.")}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/inspections/templates" size="sm" variant="ghost">
              {t("console.inspections.templates", undefined, "Templates")}
            </Button>
            <Button href="/console/inspections/new" size="sm">
              {t("console.inspections.newInspection", undefined, "+ New Inspection")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.inspections.metric.open", undefined, "Open")}
            value={fmtIntl.number(open)}
            accent
          />
          <MetricCard
            label={t("console.inspections.metric.passed", undefined, "Passed")}
            value={fmtIntl.number(passed30)}
          />
          <MetricCard
            label={t("console.inspections.metric.failed", undefined, "Failed")}
            value={fmtIntl.number(failed30)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/inspections/${r.id}`}
          emptyLabel={t("console.inspections.emptyLabel", undefined, "No inspections yet")}
          emptyDescription={t(
            "console.inspections.emptyDescription",
            undefined,
            "Inspections are checklist-driven. Define a template, then schedule instances per project or venue.",
          )}
          emptyAction={
            <Button href="/console/inspections/templates/new" size="sm">
              {t("console.inspections.createFirstTemplate", undefined, "+ Create first template")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.inspections.col.code", undefined, "Code"),
              render: (r) => r.code,
              className: "font-mono text-xs",
              accessor: (r) => r.code,
            },
            {
              key: "name",
              header: t("console.inspections.col.inspection", undefined, "Inspection"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.inspections.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "scheduled",
              header: t("console.inspections.col.scheduled", undefined, "Scheduled"),
              render: (r) => fmt(r.scheduled_for),
              className: "font-mono text-xs",
              accessor: (r) => r.scheduled_for ?? null,
            },
            {
              key: "status",
              header: t("console.inspections.col.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.inspection_state] ?? "muted"}>{toTitle(r.inspection_state)}</Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.inspection_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
