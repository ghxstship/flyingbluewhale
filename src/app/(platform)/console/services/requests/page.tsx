import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type SeverityTone = "error" | "warning" | "info" | "muted";
const SEV_TONE: Record<ServiceRequest["severity"], SeverityTone> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

type StatusTone = "info" | "warning" | "success" | "muted";
const STATUS_TONE: Record<ServiceRequest["status"], StatusTone> = {
  open: "warning",
  acknowledged: "info",
  in_progress: "info",
  resolved: "success",
  cancelled: "muted",
};

function slaChip(
  due: string | null,
  now: number,
  breached: boolean,
  translate: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
) {
  if (!due) return null;
  const ms = new Date(due).getTime() - now;
  const min = Math.round(ms / 60000);
  if (breached || ms < 0)
    return (
      <Badge variant="error" className="ms-2">
        {translate("console.services.requests.slaBreached", undefined, "SLA breached")}
      </Badge>
    );
  if (min < 15)
    return (
      <Badge variant="warning" className="ms-2">
        {translate("console.services.requests.minutesLeft", { min }, `${min}m left`)}
      </Badge>
    );
  return null;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.services.requests.eyebrow", undefined, "Services")}
          title={t("console.services.requests.title", undefined, "Service Requests")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.services.requests.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("service_requests")
    .select(
      "id, category, severity, summary, status, opened_at, sla_response_due, sla_resolution_due, sla_response_breached, sla_resolution_breached, venue_id",
    )
    .eq("org_id", session.orgId)
    .order("opened_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Pick<
    ServiceRequest,
    | "id"
    | "category"
    | "severity"
    | "summary"
    | "status"
    | "opened_at"
    | "sla_response_due"
    | "sla_resolution_due"
    | "sla_response_breached"
    | "sla_resolution_breached"
    | "venue_id"
  >[];

  const now = Date.now();
  const open = rows.filter((r) => r.status !== "resolved" && r.status !== "cancelled").length;
  const breached = rows.filter((r) => r.sla_response_breached || r.sla_resolution_breached).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.services.requests.eyebrow", undefined, "Services")}
        title={t("console.services.requests.title", undefined, "Service Requests")}
        subtitle={t(
          "console.services.requests.subtitle",
          { open, breached, total: rows.length },
          `${open} Open  · ${breached} SLA breached · ${rows.length} Total`,
        )}
        action={
          <Button href="/console/services/requests/new" size="sm">
            {t("console.services.requests.openRequest", undefined, "+ Open request")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/services/requests/${r.id}`}
          emptyLabel={t("console.services.requests.emptyLabel", undefined, "No service requests")}
          emptyDescription={t(
            "console.services.requests.emptyDescription",
            undefined,
            "Triage queue for live-event service tickets — AV breakdowns, cleaning, repairs, hospitality, IT, security. P1 unacknowledged past the response SLA escalates to a crisis alert.",
          )}
          emptyAction={
            <Button href="/console/services/requests/new" size="sm">
              {t("console.services.requests.openRequest", undefined, "+ Open request")}
            </Button>
          }
          columns={[
            {
              key: "severity",
              header: t("console.services.requests.columns.severity", undefined, "Sev"),
              render: (r) => (
                <Badge variant={SEV_TONE[r.severity as ServiceRequest["severity"]]}>{String(r.severity)}</Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.severity ?? null,
            },
            {
              key: "category",
              header: t("console.services.requests.columns.category", undefined, "Category"),
              render: (r) => <span className="font-mono text-xs">{String(r.category)}</span>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.category ?? null,
            },
            {
              key: "summary",
              header: t("console.services.requests.columns.summary", undefined, "Summary"),
              render: (r) => String(r.summary ?? "—"),
              accessor: (r) => r.summary ?? null,
            },
            {
              key: "status",
              header: t("console.services.requests.columns.status", undefined, "Status"),
              render: (r) => (
                <span className="flex items-center">
                  <Badge variant={STATUS_TONE[r.status as ServiceRequest["status"]]}>{toTitle(String(r.status))}</Badge>
                  {(r.status === "open" || r.status === "acknowledged" || r.status === "in_progress") &&
                    slaChip(
                      (r.status === "open" ? r.sla_response_due : r.sla_resolution_due) as string | null,
                      now,
                      Boolean(r.status === "open" ? r.sla_response_breached : r.sla_resolution_breached),
                      t,
                    )}
                </span>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
            {
              key: "opened",
              header: t("console.services.requests.columns.opened", undefined, "Opened"),
              render: (r) => <span className="font-mono text-xs">{fmt.dateTime(String(r.opened_at))}</span>,
              accessor: (r) => r.opened_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
