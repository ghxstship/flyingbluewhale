import { ModuleHeader } from "@/components/Shell";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

// Mirrors src/app/(platform)/console/page.tsx — keep in sync.
const DASHBOARD_TABS = [
  { label: "Overview", href: "/console" },
  { label: "Portfolio", href: "/console/dashboards" },
  { label: "Action Items", href: "/console/action-items" },
];

type ProjectKpi = {
  id: string;
  name: string;
  open_rfis: number;
  open_punch: number;
  open_inspections: number;
  recordable_30d: number;
  budget_cents: number;
  spent_cents: number;
};

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  // Load active projects, then run targeted aggregate queries per dimension.
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, budget_cents")
    .eq("org_id", session.orgId)
    .in("status", ["active", "draft"])
    .order("name")
    .limit(50);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) {
    return (
      <>
        <ModuleHeader eyebrow="Workspace" title="Portfolio Dashboard" tabs={<RouteTabs tabs={DASHBOARD_TABS} />} />
        <div className="page-content">
          <div className="surface p-6 text-sm">No active projects.</div>
        </div>
      </>
    );
  }
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run all per-dimension queries in parallel; we'll bucket counts by project_id.
  const [rfis, punch, insp, recordable, spent] = await Promise.all([
    supabase
      .from("rfis")
      .select("project_id")
      .eq("org_id", session.orgId)
      .eq("status", "open")
      .in("project_id", projectIds),
    supabase
      .from("punch_items")
      .select("project_id")
      .eq("org_id", session.orgId)
      .in("status", ["open", "in_progress", "ready_for_review"])
      .in("project_id", projectIds),
    supabase
      .from("inspections")
      .select("project_id")
      .eq("org_id", session.orgId)
      .in("status", ["scheduled", "in_progress"])
      .in("project_id", projectIds),
    supabase
      .from("incidents")
      .select("project_id")
      .eq("org_id", session.orgId)
      .eq("osha_recordable", true)
      .gte("occurred_at", since30),
    supabase.from("budgets").select("project_id, spent_cents").eq("org_id", session.orgId).in("project_id", projectIds),
  ]);

  const count = (rs: Array<{ project_id: string | null }> | null, pid: string) =>
    (rs ?? []).filter((r) => r.project_id === pid).length;
  const sumSpent = (rs: Array<{ project_id: string | null; spent_cents: number }> | null, pid: string) =>
    (rs ?? []).filter((r) => r.project_id === pid).reduce((s, r) => s + Number(r.spent_cents), 0);

  const kpis: ProjectKpi[] = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    open_rfis: count(rfis.data, p.id),
    open_punch: count(punch.data, p.id),
    open_inspections: count(insp.data, p.id),
    recordable_30d: count(recordable.data, p.id),
    budget_cents: p.budget_cents ?? 0,
    spent_cents: sumSpent(spent.data, p.id),
  }));

  const totals = kpis.reduce(
    (acc, k) => ({
      rfis: acc.rfis + k.open_rfis,
      punch: acc.punch + k.open_punch,
      insp: acc.insp + k.open_inspections,
      recordable: acc.recordable + k.recordable_30d,
    }),
    { rfis: 0, punch: 0, insp: 0, recordable: 0 },
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Workspace"
        title="Portfolio Dashboard"
        subtitle={`${kpis.length} active project${kpis.length === 1 ? "" : "s"}`}
        tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open RFIs" value={fmt.number(totals.rfis)} accent />
          <MetricCard label="Open Punch" value={fmt.number(totals.punch)} />
          <MetricCard label="OSHA recordables · 30d" value={fmt.number(totals.recordable)} />
        </div>
        <section>
          <h3 className="pb-3 text-base font-semibold">Per-Project KPIs</h3>
          <DataTable<ProjectKpi>
            rows={kpis}
            rowHref={(k) => `/console/projects/${k.id}`}
            emptyLabel="No Active Projects"
            columns={[
              { key: "name", header: "Project", render: (k) => k.name, accessor: (k) => k.name, sortable: true },
              {
                key: "open_rfis",
                header: "Open RFIs",
                render: (k) => k.open_rfis,
                accessor: (k) => k.open_rfis,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
              {
                key: "open_punch",
                header: "Open Punch",
                render: (k) => k.open_punch,
                accessor: (k) => k.open_punch,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
              {
                key: "open_inspections",
                header: "Open Inspections",
                render: (k) => k.open_inspections,
                accessor: (k) => k.open_inspections,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
              {
                key: "recordable_30d",
                header: "Recordables (30d)",
                render: (k) => k.recordable_30d,
                accessor: (k) => k.recordable_30d,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
              {
                key: "budget_cents",
                header: "Budget",
                render: (k) => formatMoney(k.budget_cents),
                accessor: (k) => k.budget_cents,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
              {
                key: "spent_cents",
                header: "Spent",
                render: (k) => formatMoney(k.spent_cents),
                accessor: (k) => k.spent_cents,
                tabular: true,
                sortable: true,
                className: "text-right",
                headerClassName: "text-right",
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
