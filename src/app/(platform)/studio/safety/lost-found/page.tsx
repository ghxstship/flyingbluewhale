import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  summary: string;
  severity: string;
  incident_state: string;
  occurred_at: string;
  closed_at: string | null;
  location: string | null;
};

/**
 * Lost & Found (kit 20 Safety · Protect tab) — the property lens over the
 * incidents store. There is no separate lost-found table (ADR-0014): field
 * crews file "Report It · Lost" through the lost & found intake
 * (`/m/lost-found`), which lands here as a `report_kind = 'lost_property'`
 * row. The honest filtered-alias pattern, not a parallel store.
 *
 * This used to filter on `injury_type IS NULL` and call that "the property
 * lens". It wasn't: spills, near-misses and equipment damage all have a
 * null injury_type, and the COMPVSS intake never wrote the column at all,
 * so every field-filed report — injuries included — showed up here as lost
 * property. Filter on the discriminator, never on the absence of an injury.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.lostFound.eyebrow", undefined, "Safety · Protect")}
          title={t("console.lostFound.title", undefined, "Lost & Found")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.lostFound.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, incident_state, occurred_at, closed_at, location")
    .eq("org_id", session.orgId)
    .eq("report_kind", "lost_property")
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => !r.closed_at).length;
  const returned = rows.filter((r) => !!r.closed_at).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.lostFound.eyebrow", undefined, "Safety · Protect")}
        title={t("console.lostFound.title", undefined, "Lost & Found")}
        subtitle={t(
          "console.lostFound.subtitle",
          undefined,
          "Property reports filed through Report It. Closing a report records the return.",
        )}
        action={
          <Button href="/studio/operations/incidents/new" size="sm">
            {t("console.lostFound.report", undefined, "+ Report An Item")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.lostFound.metric.open", undefined, "Open Reports")}
            value={fmt.number(open)}
            accent
          />
          <MetricCard
            label={t("console.lostFound.metric.returned", undefined, "Closed / Returned")}
            value={fmt.number(returned)}
          />
          <MetricCard
            label={t("console.lostFound.metric.total", undefined, "Total Reports")}
            value={fmt.number(rows.length)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/operations/incidents/${r.id}`}
          emptyLabel={t("console.lostFound.emptyLabel", undefined, "No property reports")}
          emptyDescription={t(
            "console.lostFound.emptyDescription",
            undefined,
            "Field crews file lost or found items through Report It on COMPVSS; reports triage here.",
          )}
          emptyAction={
            <Button href="/studio/operations/incidents/new" size="sm">
              {t("console.lostFound.report", undefined, "+ Report An Item")}
            </Button>
          }
          columns={[
            {
              key: "summary",
              header: t("console.lostFound.column.item", undefined, "Report"),
              render: (r) => r.summary,
              accessor: (r) => r.summary,
            },
            {
              key: "location",
              header: t("console.lostFound.column.location", undefined, "Location"),
              render: (r) => r.location ?? "—",
              accessor: (r) => r.location ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("console.lostFound.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.incident_state)}>{toTitle(r.incident_state)}</Badge>,
              accessor: (r) => r.incident_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "occurred",
              header: t("console.lostFound.column.reported", undefined, "Reported"),
              render: (r) => fmt.dateParts(r.occurred_at, { month: "short", day: "numeric" }),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at,
            },
          ]}
        />
      </div>
    </>
  );
}
