import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { SEVERITY_TONE, toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  summary: string;
  description: string | null;
  severity: string;
  incident_state: string;
};

const CYBER_PATTERN = /(cyber|breach|phish|ransom|malware|ddos|intrusion|credential|access\b|c2\b)/i;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
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
          eyebrow={t("console.safety.cyberIr.eyebrow", undefined, "Safety")}
          title={t("console.safety.cyberIr.title", undefined, "Cyber Incident Response")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.cyberIr.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("incidents")
    .select("id, occurred_at, summary, description, severity, incident_state")
    .eq("org_id", session.orgId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(500);

  const all = (data ?? []) as IncidentRow[];
  const rows = all.filter(
    (r) => CYBER_PATTERN.test(r.summary) || (r.description ? CYBER_PATTERN.test(r.description) : false),
  );
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.incident_state)).length;
  const containment = rows.filter((r) => r.incident_state === "in_progress").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.cyberIr.eyebrow", undefined, "Safety")}
        title={t("console.safety.cyberIr.title", undefined, "Cyber Incident Response")}
        subtitle={
          rows.length === 1
            ? t(
                "console.safety.cyberIr.subtitleOne",
                { count: rows.length },
                `${rows.length} cyber incident in the last 90 days`,
              )
            : t(
                "console.safety.cyberIr.subtitleOther",
                { count: rows.length },
                `${rows.length} cyber incidents in the last 90 days`,
              )
        }
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            {t("console.safety.cyberIr.reportIncident", undefined, "+ Report incident")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.cyberIr.metricOpen", undefined, "Open")}
            value={fmtIntl.number(open)}
            accent
          />
          <MetricCard
            label={t("console.safety.cyberIr.metricContainment", undefined, "In Containment")}
            value={fmtIntl.number(containment)}
          />
          <MetricCard
            label={t("console.safety.cyberIr.metricClosed90d", undefined, "Closed · 90d")}
            value={fmtIntl.number(rows.length - open)}
          />
        </div>

        <DataTable<IncidentRow>
          rows={rows}
          rowHref={(r) => `/console/operations/incidents/${r.id}`}
          emptyLabel={t("console.safety.cyberIr.emptyLabel", undefined, "No cyber incidents flagged")}
          emptyDescription={t(
            "console.safety.cyberIr.emptyDescription",
            undefined,
            "Cyber IR is a sub-type of incidents. Tag a report with terms like 'breach', 'phish', or 'cyber' in the summary and it appears here.",
          )}
          columns={[
            {
              key: "summary",
              header: t("console.safety.cyberIr.columnSummary", undefined, "Summary"),
              render: (r) => r.summary,
              accessor: (r) => r.summary,
            },
            {
              key: "occurred",
              header: t("console.safety.cyberIr.columnOccurred", undefined, "Occurred"),
              render: (r) => fmt(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "severity",
              header: t("console.safety.cyberIr.columnSeverity", undefined, "Severity"),
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.safety.cyberIr.columnStatus", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.incident_state)}>{toTitle(r.incident_state)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.incident_state ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.safety.cyberIr.lifecycleNote",
            undefined,
            "Lifecycle: detect → contain → eradicate → recover → lessons. Open the source incident to update its phase.",
          )}
        </p>
      </div>
    </>
  );
}
