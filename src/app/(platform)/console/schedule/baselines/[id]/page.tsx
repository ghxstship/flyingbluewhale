import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { activateBaseline, archiveBaseline, runCpm } from "./actions";
import { ImportScheduleClient } from "./import-client";

export const dynamic = "force-dynamic";

type BaselineState = "draft" | "active" | "archived";

type Baseline = {
  id: string;
  name: string;
  description: string | null;
  baseline_state: BaselineState;
  imported_from: string | null;
  imported_at: string | null;
  snapshot_at: string | null;
  project: { id: string; name: string | null } | null;
};

type Activity = {
  id: string;
  code: string;
  name: string;
  start_planned: string;
  finish_planned: string;
  duration_days: number;
  total_float_days: number | null;
  is_critical: boolean;
  percent_complete: number;
};

const STATE_TONE: Record<BaselineState, "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  active: "success",
  archived: "info",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { id } = await params;

  const { data: row } = await supabase
    .from("schedule_baselines")
    .select(
      "id, name, description, baseline_state, imported_from, imported_at, snapshot_at, project:project_id(id, name)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const baseline = row as unknown as Baseline;

  const { data: actData } = await supabase
    .from("schedule_activities")
    .select(
      "id, code, name, start_planned, finish_planned, duration_days, total_float_days, is_critical, percent_complete",
    )
    .eq("baseline_id", id)
    .eq("org_id", session.orgId)
    .order("start_planned", { ascending: true })
    .limit(2000);
  const activities = (actData ?? []) as unknown as Activity[];

  const criticalCount = activities.filter((a) => a.is_critical).length;
  const totalCount = activities.length;
  const totalDuration = activities.reduce((s, a) => s + Number(a.duration_days || 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={`Schedule · ${baseline.project?.name ?? "Project"}`}
        title={baseline.name}
        subtitle={`${totalCount} activities · ${criticalCount} critical · ${totalDuration.toFixed(1)} cumulative days`}
        action={
          <Button href="/console/schedule/baselines" size="sm" variant="ghost">
            ← All Baselines
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[baseline.baseline_state]}>{toTitle(baseline.baseline_state)}</Badge>
          {baseline.imported_from && (
            <span className="font-mono text-[var(--text-muted)]">Imported from {baseline.imported_from}</span>
          )}
          {baseline.snapshot_at && (
            <span className="font-mono text-[var(--text-muted)]">
              Snapshot · {fmt.dateParts(baseline.snapshot_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          <span className="ms-auto flex gap-2">
            {activities.length > 0 && (
              <form action={runCpm}>
                <input type="hidden" name="baseline_id" value={baseline.id} />
                <Button type="submit" size="sm" variant="secondary">
                  Re-run CPM
                </Button>
              </form>
            )}
            {baseline.baseline_state === "draft" && (
              <form action={activateBaseline}>
                <input type="hidden" name="baseline_id" value={baseline.id} />
                <Button type="submit" size="sm">
                  Activate
                </Button>
              </form>
            )}
            {baseline.baseline_state === "active" && (
              <form action={archiveBaseline}>
                <input type="hidden" name="baseline_id" value={baseline.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Archive
                </Button>
              </form>
            )}
          </span>
        </div>

        <div className="metric-grid-3">
          <MetricCard label="Activities" value={fmt.number(totalCount)} accent />
          <MetricCard label="On Critical Path" value={fmt.number(criticalCount)} />
          <MetricCard label="Cumulative Days" value={totalDuration.toFixed(1)} />
        </div>

        {activities.length === 0 && (
          <section className="surface space-y-3 p-4">
            <h2 className="text-sm font-semibold">Import from P6 / MSP / Asta</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Paste or upload an XER (P6) or XML (P6 / Microsoft Project / Asta Powerproject) export to populate
              activities + dependencies in this baseline. Re-imports overwrite the current activity set.
            </p>
            <ImportScheduleClient baselineId={baseline.id} />
          </section>
        )}

        <DataTable<Activity>
          rows={activities}
          emptyLabel="No activities in this baseline yet"
          emptyDescription="Import an XER/XML file or add activities manually to build out the schedule."
          columns={[
            {
              key: "code",
              header: "Code",
              render: (a) => a.code,
              accessor: (a) => a.code,
              className: "font-mono text-xs",
            },
            { key: "name", header: "Activity", render: (a) => a.name, accessor: (a) => a.name },
            {
              key: "start",
              header: "Start",
              render: (a) => fmt.dateParts(a.start_planned, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (a) => a.start_planned,
              className: "font-mono text-xs",
            },
            {
              key: "finish",
              header: "Finish",
              render: (a) => fmt.dateParts(a.finish_planned, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (a) => a.finish_planned,
              className: "font-mono text-xs",
            },
            {
              key: "duration",
              header: "Dur (d)",
              render: (a) => Number(a.duration_days).toFixed(1),
              accessor: (a) => Number(a.duration_days),
              className: "font-mono text-xs text-right",
            },
            {
              key: "float",
              header: "Float (d)",
              render: (a) => (a.total_float_days != null ? Number(a.total_float_days).toFixed(1) : "—"),
              accessor: (a) => a.total_float_days,
              className: "font-mono text-xs text-right",
            },
            {
              key: "critical",
              header: "Critical",
              render: (a) => (a.is_critical ? <Badge variant="error">CP</Badge> : "—"),
              accessor: (a) => (a.is_critical ? "yes" : "no"),
              filterable: true,
            },
            {
              key: "progress",
              header: "%",
              render: (a) => `${Number(a.percent_complete).toFixed(0)}%`,
              accessor: (a) => Number(a.percent_complete),
              className: "font-mono text-xs text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
