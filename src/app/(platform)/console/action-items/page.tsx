import { ModuleHeader } from "@/components/Shell";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

// Mirrors src/app/(platform)/console/page.tsx — keep in sync.
function buildDashboardTabs(t: (k: string, v?: Record<string, string | number>, f?: string) => string) {
  return [
    { label: t("console.dashboard.tabs.overview", undefined, "Overview"), href: "/console" },
    { label: t("console.dashboard.tabs.portfolio", undefined, "Portfolio"), href: "/console/dashboards" },
    { label: t("console.dashboard.tabs.actionItems", undefined, "Action Items"), href: "/console/action-items" },
  ];
}

type Row = {
  kind: string;
  record_id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  owner_id: string | null;
  due_at: string | null;
  status: string;
  priority: string;
  created_at: string;
};

const KIND_HREF: Record<string, (id: string) => string> = {
  rfi: (id) => `/console/rfis/${id}`,
  submittal: (id) => `/console/submittals/${id}`,
  punch: (id) => `/console/punch/${id}`,
  inspection: (id) => `/console/inspections/${id}`,
  task: (id) => `/console/tasks/${id}`,
};

const KIND_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  rfi: "info",
  submittal: "info",
  punch: "warning",
  inspection: "info",
  task: "muted",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { t } = await getRequestT();
  const DASHBOARD_TABS = buildDashboardTabs(t);
  let q = supabase
    .from("v_action_items")
    .select("*")
    .eq("org_id", session.orgId)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (sp.mine === "1") q = q.eq("owner_id", session.userId);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const overdue = rows.filter((r) => r.due_at && new Date(r.due_at) < new Date()).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.actionItems.eyebrow", undefined, "Workspace")}
        title={t("console.actionItems.title", undefined, "Action Items")}
        subtitle={t("console.actionItems.subtitle", undefined, "Cross-module ball-in-court rollup.")}
        action={
          <a
            href={sp.mine === "1" ? "/console/action-items" : "/console/action-items?mine=1"}
            className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {sp.mine === "1"
              ? t("console.actionItems.filter.all", undefined, "All")
              : t("console.actionItems.filter.mineOnly", undefined, "Mine only")}
          </a>
        }
        tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.actionItems.metrics.openItems", undefined, "Open Items")}
            value={fmtIntl.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.actionItems.metrics.overdue", undefined, "Overdue")}
            value={fmtIntl.number(overdue)}
          />
          <MetricCard
            label={t("console.actionItems.metrics.acrossKinds", undefined, "Across Kinds")}
            value={Object.keys(byKind).length.toString()}
          />
        </div>
        <DataTable<Row & { id: string }>
          rows={rows.map((r) => ({ ...r, id: `${r.kind}-${r.record_id}` }))}
          rowHref={(r) => (KIND_HREF[r.kind] ?? ((id) => `#${id}`))(r.record_id)}
          emptyLabel={t("console.actionItems.empty.label", undefined, "Inbox Zero")}
          emptyDescription={t(
            "console.actionItems.empty.description",
            undefined,
            "Nothing open. Every RFI, submittal, punch item, inspection, and task is closed or assigned.",
          )}
          columns={[
            {
              key: "kind",
              header: t("console.actionItems.columns.kind", undefined, "Kind"),
              render: (r) => <Badge variant={KIND_TONE[r.kind] ?? "muted"}>{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "title",
              header: t("console.actionItems.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
              sortable: true,
            },
            {
              key: "status",
              header: t("console.actionItems.columns.status", undefined, "Status"),
              render: (r) => toTitle(r.status),
              accessor: (r) => r.status,
              filterable: true,
            },
            {
              key: "due_at",
              header: t("console.actionItems.columns.due", undefined, "Due"),
              render: (r) => (
                <span className={r.due_at && new Date(r.due_at) < new Date() ? "text-[var(--color-error)]" : ""}>
                  {fmt(r.due_at)}
                </span>
              ),
              accessor: (r) => r.due_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "priority",
              header: t("console.actionItems.columns.priority", undefined, "Priority"),
              render: (r) => r.priority,
              accessor: (r) => r.priority,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
