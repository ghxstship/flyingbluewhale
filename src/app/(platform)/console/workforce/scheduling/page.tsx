import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { ScheduleGeneratorPanel } from "./ScheduleGeneratorPanel";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  week_start: string;
  project_id: string | null;
  generation_state: string;
  created_at: string;
  applied_at: string | null;
  coverage_pct: number | null;
};

const STATE_TONE: Record<string, "success" | "info" | "muted" | "warning"> = {
  generated: "info",
  applied: "success",
  dismissed: "muted",
  pending: "warning",
};

export default async function SchedulingPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce · AI" title="AI Scheduler" />
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
    .from("ai_schedule_suggestions")
    .select("id, week_start, project_id, generation_state, created_at, applied_at, suggestion_data")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rawRows = (data ?? []) as (Row & { suggestion_data: { coverage_pct?: number } | null })[];
  const rows: Row[] = rawRows.map((r) => ({
    id: r.id,
    week_start: r.week_start,
    project_id: r.project_id,
    generation_state: r.generation_state,
    created_at: r.created_at,
    applied_at: r.applied_at,
    coverage_pct: r.suggestion_data?.coverage_pct ?? null,
  }));

  const applied = rows.filter((r) => r.generation_state === "applied").length;
  const pending = rows.filter((r) => r.generation_state === "generated").length;
  const avgCoverage =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + (r.coverage_pct ?? 0), 0) / rows.length)
      : 0;

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce · AI"
        title="AI Scheduler"
        subtitle="One-click shift schedule generation — Connecteam + Deputy parity"
      />
      <div className="page-content space-y-5">
        <ScheduleGeneratorPanel />

        <div className="metric-grid-3">
          <MetricCard label="Suggestions Generated" value={String(rows.length)} accent />
          <MetricCard label="Applied to Schedule" value={String(applied)} />
          <MetricCard label="Avg Coverage" value={rows.length ? `${avgCoverage}%` : "—"} />
        </div>

        {pending > 0 && (
          <div className="surface-inset rounded-lg p-4 text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--foreground)]">{pending} suggestion{pending === 1 ? "" : "s"} pending review.</span>{" "}
            Click a row to view the full schedule and apply shifts.
          </div>
        )}

        <DataTable<Row>
          rows={rows}
          emptyLabel="No schedule suggestions yet"
          emptyDescription="Generate your first AI schedule above — the AI reads your crew roster and role requirements, then drafts a complete week."
          columns={[
            {
              key: "week",
              header: "Week of",
              render: (r) =>
                fmt.dateParts(r.week_start + "T00:00:00", { weekday: "short", month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.week_start,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => (
                <Badge variant={STATE_TONE[r.generation_state] ?? "muted"}>
                  {r.generation_state}
                </Badge>
              ),
              accessor: (r) => r.generation_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "coverage",
              header: "Coverage",
              render: (r) =>
                r.coverage_pct != null ? (
                  <span className={r.coverage_pct >= 90 ? "text-[var(--success)]" : r.coverage_pct >= 70 ? "" : "text-[var(--warning)]"}>
                    {r.coverage_pct}%
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                ),
              accessor: (r) => r.coverage_pct ?? 0,
              className: "font-mono text-xs text-right",
            },
            {
              key: "applied",
              header: "Applied",
              render: (r) =>
                r.applied_at
                  ? fmt.dateParts(r.applied_at, { month: "short", day: "numeric" })
                  : <span className="text-[var(--text-muted)]">—</span>,
              accessor: (r) => r.applied_at ?? "",
              className: "font-mono text-xs",
            },
            {
              key: "created",
              header: "Generated",
              render: (r) => fmt.dateParts(r.created_at, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.created_at,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
