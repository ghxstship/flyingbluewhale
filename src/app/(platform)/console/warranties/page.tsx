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

type WarrantyState = "active" | "expiring_soon" | "expired" | "voided";

type Row = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  duration_months: number | null;
  warranty_state: WarrantyState;
  warrantor_name: string | null;
  project: { name: string | null } | null;
  vendor: { name: string | null } | null;
};

const STATE_TONE: Record<WarrantyState, "muted" | "info" | "warning" | "success" | "error"> = {
  active: "success",
  expiring_soon: "warning",
  expired: "muted",
  voided: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Closeout" title="Warranties" />
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
    .from("warranties")
    .select(
      "id, name, start_date, end_date, duration_months, warranty_state, warrantor_name, project:project_id(name), vendor:vendor_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("end_date", { ascending: true })
    .limit(300);

  const rows = (data ?? []) as unknown as Row[];

  const activeCount = rows.filter((r) => r.warranty_state === "active").length;
  const expiringSoonCount = rows.filter((r) => r.warranty_state === "expiring_soon").length;
  const expiredCount = rows.filter((r) => r.warranty_state === "expired").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Closeout"
        title="Warranties"
        subtitle={`${rows.length} warranties · ${activeCount} active · ${expiringSoonCount} expiring soon · ${expiredCount} expired`}
        action={
          <Button href="/console/warranties/new" size="sm">
            + New Warranty
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active" value={fmt.number(activeCount)} accent />
          <MetricCard label="Expiring Soon" value={fmt.number(expiringSoonCount)} />
          <MetricCard label="Expired" value={fmt.number(expiredCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/warranties/${r.id}`}
          emptyLabel="No warranties tracked yet"
          emptyDescription="Capture warranty coverage at closeout. The nightly batch advances warranty_state from active → expiring_soon → expired so the dashboard always shows current risk."
          emptyAction={
            <Button href="/console/warranties/new" size="sm">
              + New Warranty
            </Button>
          }
          columns={[
            { key: "name", header: "Coverage", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "warrantor",
              header: "Warrantor",
              render: (r) => r.warrantor_name ?? r.vendor?.name ?? "—",
              accessor: (r) => r.warrantor_name ?? r.vendor?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "start",
              header: "Start",
              render: (r) =>
                fmt.dateParts(r.start_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.start_date,
              className: "font-mono text-xs",
            },
            {
              key: "end",
              header: "End",
              render: (r) =>
                fmt.dateParts(r.end_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.end_date,
              className: "font-mono text-xs",
            },
            {
              key: "duration",
              header: "Months",
              render: (r) => (r.duration_months != null ? r.duration_months.toString() : "—"),
              accessor: (r) => r.duration_months,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.warranty_state]}>{toTitle(r.warranty_state)}</Badge>,
              accessor: (r) => r.warranty_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
