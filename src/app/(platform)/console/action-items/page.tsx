import { ModuleHeader } from "@/components/Shell";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

// Mirrors src/app/(platform)/console/page.tsx — keep in sync.
const DASHBOARD_TABS = [
  { label: "Overview", href: "/console" },
  { label: "Portfolio", href: "/console/dashboards" },
  { label: "Action Items", href: "/console/action-items" },
];

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
  return formatDate(d);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
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
        eyebrow="Workspace"
        title="Action Items"
        subtitle="Cross-module ball-in-court rollup — RFIs, submittals, punch, inspections, tasks."
        action={
          <a
            href={sp.mine === "1" ? "/console/action-items" : "/console/action-items?mine=1"}
            className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {sp.mine === "1" ? "All" : "Mine only"}
          </a>
        }
        tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open Items" value={fmtIntl.number(rows.length)} accent />
          <MetricCard label="Overdue" value={fmtIntl.number(overdue)} />
          <MetricCard label="Across Kinds" value={Object.keys(byKind).length.toString()} />
        </div>
        <DataTable<Row & { id: string }>
          rows={rows.map((r) => ({ ...r, id: `${r.kind}-${r.record_id}` }))}
          rowHref={(r) => (KIND_HREF[r.kind] ?? ((id) => `#${id}`))(r.record_id)}
          emptyLabel="Inbox Zero"
          emptyDescription="Nothing open. Every RFI, submittal, punch item, inspection, and task is closed or assigned."
          columns={[
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant={KIND_TONE[r.kind] ?? "muted"}>{r.kind}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title, sortable: true },
            {
              key: "status",
              header: "Status",
              render: (r) => r.status.replace(/_/g, " "),
              accessor: (r) => r.status,
              filterable: true,
            },
            {
              key: "due_at",
              header: "Due",
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
              header: "Priority",
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
