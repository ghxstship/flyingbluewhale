import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

// RFQs are a PROJECTION of `requisitions` in the submitted/approved states
// (awaiting vendor quotes) — there is no separate `rfqs` table. The row shape
// is therefore a requisition; `requisition_state` is the lifecycle column and
// rowHref points back into /procurement/requisitions/[id].
type RfqRow = {
  id: string;
  title: string;
  description: string | null;
  estimated_cents: number | null;
  status: string;
  created_at: string;
  project: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.rfqs.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.rfqs.title", undefined, "RFQs")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.rfqs.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  const { data } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, status:requisition_state, created_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .in("requisition_state", ["submitted", "approved"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as RfqRow[];
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const totalEstimate = rows.reduce((s, r) => s + (r.estimated_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.rfqs.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.rfqs.title", undefined, "RFQs")}
        subtitle={t(
          "console.procurement.rfqs.subtitle",
          { open: rows.length, submitted, approved },
          `${rows.length} Open  · ${submitted} submitted · ${approved} Approved`,
        )}
        action={
          <Button href="/console/procurement/requisitions/new" size="sm">
            {t("console.procurement.rfqs.newRfq", undefined, "+ New RFQ")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.rfqs.metric.openRfqs", undefined, "Open RFQs")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.procurement.rfqs.metric.submitted", undefined, "Submitted")}
            value={fmt.number(submitted)}
          />
          <MetricCard
            label={t("console.procurement.rfqs.metric.totalEstimate", undefined, "Total Estimate")}
            value={formatMoney(totalEstimate)}
          />
        </div>

        <DataTable<RfqRow>
          rows={rows}
          rowHref={(r) => `/console/procurement/requisitions/${r.id}`}
          emptyLabel={t("console.procurement.rfqs.emptyLabel", undefined, "No open RFQs")}
          emptyDescription={t(
            "console.procurement.rfqs.emptyDescription",
            undefined,
            "RFQs are submitted/approved requisitions awaiting vendor quotes. Author one via Procurement → Requisitions.",
          )}
          emptyAction={
            <Button href="/console/procurement/requisitions/new" size="sm">
              {t("console.procurement.rfqs.newRfq", undefined, "+ New RFQ")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.procurement.rfqs.column.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "project",
              header: t("console.procurement.rfqs.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "estimate",
              header: t("console.procurement.rfqs.column.estimate", undefined, "Estimate"),
              render: (r) => formatMoney(r.estimated_cents ?? 0),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.estimated_cents ?? 0),
            },
            {
              key: "created",
              header: t("console.procurement.rfqs.column.created", undefined, "Created"),
              render: (r) => fmtDate(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at ?? null,
            },
            {
              key: "status",
              header: t("console.procurement.rfqs.column.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
