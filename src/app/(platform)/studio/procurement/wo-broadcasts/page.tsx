import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDateParts, formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  broadcast_state: string;
  budget_cents: number | null;
  needed_by: string | null;
  awarded_to: { name: string | null } | null;
  project: { name: string | null } | null;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return formatDateParts(new Date(iso), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("work_order_broadcasts")
    .select(
      "id, code, title, broadcast_state, budget_cents, needed_by, awarded_to:awarded_to_vendor_id(name), project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.broadcast_state === "open").length;
  const awarded = rows.filter((r) => r.broadcast_state === "awarded").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.woBroadcasts.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.woBroadcasts.title", undefined, "Work Order Broadcasts")}
        subtitle={t(
          "console.procurement.woBroadcasts.subtitle",
          undefined,
          "Open requests to the vendor pool. First qualified responder wins.",
        )}
        action={
          <Button href="/studio/procurement/wo-broadcasts/new" size="sm">
            {t("console.procurement.woBroadcasts.newBroadcast", undefined, "+ New Broadcast")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.woBroadcasts.metrics.open", undefined, "Open")}
            value={fmtIntl.number(open)}
            accent
          />
          <MetricCard
            label={t("console.procurement.woBroadcasts.metrics.awarded", undefined, "Awarded")}
            value={fmtIntl.number(awarded)}
          />
          <MetricCard
            label={t("console.procurement.woBroadcasts.metrics.total", undefined, "Total")}
            value={fmtIntl.number(rows.length)}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/procurement/wo-broadcasts/${r.id}`}
          emptyLabel={t("console.procurement.woBroadcasts.emptyLabel", undefined, "No broadcasts yet")}
          emptyDescription={t(
            "console.procurement.woBroadcasts.emptyDescription",
            undefined,
            "Use this for emergency / last-minute needs (extra security, replacement gear). Posted to vendor pool, accepted by first qualified responder.",
          )}
          emptyAction={
            <Button href="/studio/procurement/wo-broadcasts/new" size="sm">
              {t("console.procurement.woBroadcasts.newBroadcast", undefined, "+ New Broadcast")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.procurement.woBroadcasts.columns.code", undefined, "Code"),
              render: (r) => r.code,
              mono: true,
              accessor: (r) => r.code,
            },
            {
              key: "title",
              header: t("console.procurement.woBroadcasts.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "project",
              header: t("console.procurement.woBroadcasts.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
            },
            {
              key: "budget",
              header: t("console.procurement.woBroadcasts.columns.budget", undefined, "Budget"),
              render: (r) => (r.budget_cents ? formatMoney(r.budget_cents) : "—"),
              mono: true,
              accessor: (r) => Number(r.budget_cents ?? 0),
            },
            {
              key: "needed",
              header: t("console.procurement.woBroadcasts.columns.neededBy", undefined, "Needed By"),
              render: (r) => fmt(r.needed_by),
              mono: true,
              accessor: (r) => r.needed_by ?? null,
            },
            {
              key: "awarded",
              header: t("console.procurement.woBroadcasts.columns.awardedTo", undefined, "Awarded To"),
              render: (r) => r.awarded_to?.name ?? "—",
              accessor: (r) => r.awarded_to?.name ?? null,
            },
            {
              key: "status",
              header: t("console.procurement.woBroadcasts.columns.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.broadcast_state)}>{toTitle(r.broadcast_state)}</Badge>,
              accessor: (r) => r.broadcast_state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
