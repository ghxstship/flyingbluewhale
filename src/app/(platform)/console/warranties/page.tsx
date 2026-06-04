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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.warranties.eyebrow", undefined, "Closeout")}
          title={t("console.warranties.title", undefined, "Warranties")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.warranties.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.warranties.eyebrow", undefined, "Closeout")}
        title={t("console.warranties.title", undefined, "Warranties")}
        subtitle={t(
          "console.warranties.subtitle",
          {
            total: rows.length,
            active: activeCount,
            expiringSoon: expiringSoonCount,
            expired: expiredCount,
          },
          `${rows.length} warranties · ${activeCount} active · ${expiringSoonCount} expiring soon · ${expiredCount} expired`,
        )}
        action={
          <Button href="/console/warranties/new" size="sm">
            {t("console.warranties.newWarranty", undefined, "+ New Warranty")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.warranties.metrics.active", undefined, "Active")}
            value={fmt.number(activeCount)}
            accent
          />
          <MetricCard
            label={t("console.warranties.metrics.expiringSoon", undefined, "Expiring Soon")}
            value={fmt.number(expiringSoonCount)}
          />
          <MetricCard
            label={t("console.warranties.metrics.expired", undefined, "Expired")}
            value={fmt.number(expiredCount)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/warranties/${r.id}`}
          emptyLabel={t("console.warranties.emptyLabel", undefined, "No warranties tracked yet")}
          emptyDescription={t(
            "console.warranties.emptyDescription",
            undefined,
            "Capture warranty coverage at closeout. The nightly batch advances warranty_state from active → expiring_soon → expired so the dashboard always shows current risk.",
          )}
          emptyAction={
            <Button href="/console/warranties/new" size="sm">
              {t("console.warranties.newWarranty", undefined, "+ New Warranty")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.warranties.columns.coverage", undefined, "Coverage"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.warranties.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "warrantor",
              header: t("console.warranties.columns.warrantor", undefined, "Warrantor"),
              render: (r) => r.warrantor_name ?? r.vendor?.name ?? "—",
              accessor: (r) => r.warrantor_name ?? r.vendor?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "start",
              header: t("console.warranties.columns.start", undefined, "Start"),
              render: (r) =>
                fmt.dateParts(r.start_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.start_date,
              className: "font-mono text-xs",
            },
            {
              key: "end",
              header: t("console.warranties.columns.end", undefined, "End"),
              render: (r) =>
                fmt.dateParts(r.end_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.end_date,
              className: "font-mono text-xs",
            },
            {
              key: "duration",
              header: t("console.warranties.columns.months", undefined, "Months"),
              render: (r) => (r.duration_months != null ? r.duration_months.toString() : "—"),
              accessor: (r) => r.duration_months,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.warranties.columns.state", undefined, "State"),
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
