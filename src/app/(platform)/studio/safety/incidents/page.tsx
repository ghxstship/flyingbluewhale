import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDateParts } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { SEVERITY_TONE, toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  location: string | null;
  summary: string;
  severity: string;
  incident_state: string;
};

function fmt(iso: string): string {
  return formatDateParts(new Date(iso), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.incidents.eyebrow", undefined, "Safety")}
          title={t("console.safety.incidents.title", undefined, "Incidents")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.incidents.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Metric tiles are exact server-side aggregates on real columns
  // (incident_state / severity) — never derived from the capped row fetch,
  // and never string-matched from free text (the old "cyber" tile counted
  // ilike '%cyber%' over summaries, a pseudo-taxonomy).
  const [
    { data: incidents },
    { count: medCount },
    { count: totalCount },
    { count: openCount },
    { count: criticalCount },
  ] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, occurred_at, location, summary, severity, incident_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase
      .from("medical_encounters")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", since),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("occurred_at", since),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("occurred_at", since)
      .not("incident_state", "in", "(resolved,closed)"),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("occurred_at", since)
      .eq("severity", "critical"),
  ]);

  const rows = (incidents ?? []) as IncidentRow[];
  const open = openCount ?? 0;
  const critical = criticalCount ?? 0;
  const totalThirtyDay = totalCount ?? 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.incidents.eyebrow", undefined, "Safety")}
        title={t("console.safety.incidents.unifiedTitle", undefined, "Incidents")}
        subtitle={t("console.safety.incidents.subtitle", undefined, "Cross-domain incident feed.")}
        action={
          <Button href="/studio/operations/incidents/new" size="sm">
            {t("console.safety.incidents.reportIncident", undefined, "+ Report incident")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.incidents.metric.total30d", undefined, "Total · 30d")}
            value={fmtIntl.number(totalThirtyDay)}
            accent
          />
          <MetricCard
            label={t("console.safety.incidents.metric.open", undefined, "Open")}
            value={fmtIntl.number(open)}
          />
          <MetricCard
            label={t("console.safety.incidents.metric.critical", undefined, "Critical")}
            value={fmtIntl.number(critical)}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.safety.incidents.drillInto", undefined, "Drill Into a Domain")}
          </h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <li>
              <Link href="/studio/operations/incidents" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">
                  {t("console.safety.incidents.opsLog.title", undefined, "Operations log")}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.safety.incidents.opsLog.subtitle",
                    { count: totalThirtyDay },
                    `${totalThirtyDay} ops + safety incidents`,
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/studio/safety/cyber-ir" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">
                  {t("console.safety.incidents.cyberIr.title", undefined, "Cyber IR")}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.safety.incidents.cyberIr.staticSubtitle",
                    undefined,
                    "Security incident response workspace",
                  )}
                </div>
              </Link>
            </li>
            <li>
              <Link href="/studio/safety/medical/encounters" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">
                  {t("console.safety.incidents.medical.title", undefined, "Medical encounters")}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.safety.incidents.medical.subtitle",
                    { count: medCount ?? 0 },
                    `${medCount ?? 0} encounters · 30 days`,
                  )}
                </div>
              </Link>
            </li>
          </ul>
        </section>

        <DataView<IncidentRow>
          rows={rows}
          totalCount={totalThirtyDay}
          rowHref={(r) => `/studio/operations/incidents/${r.id}`}
          emptyLabel={t("console.safety.incidents.empty", undefined, "No Incidents in the Last 30 Days")}
          emptyDescription={t(
            "console.safety.incidents.emptyDescription",
            undefined,
            "This is your unified feed of safety, operations, cyber, and medical incidents. File one to start the record.",
          )}
          emptyAction={
            <Button href="/studio/operations/incidents/new" size="sm">
              {t("console.safety.incidents.reportFirst", undefined, "Report an Incident")}
            </Button>
          }
          columns={[
            {
              key: "summary",
              header: t("console.safety.incidents.column.summary", undefined, "Summary"),
              render: (r) => r.summary,
              accessor: (r) => r.summary,
            },
            {
              key: "occurred",
              header: t("console.safety.incidents.column.occurred", undefined, "Occurred"),
              render: (r) => fmt(r.occurred_at),
              mono: true,
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "location",
              header: t("console.safety.incidents.column.location", undefined, "Location"),
              render: (r) => r.location ?? "—",
              accessor: (r) => r.location ?? null,
            },
            {
              key: "severity",
              header: t("console.safety.incidents.column.severity", undefined, "Severity"),
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.safety.incidents.column.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.incident_state)}>{toTitle(r.incident_state)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.incident_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
