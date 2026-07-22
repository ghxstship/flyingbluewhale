import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

const SEVERITY_TONE: Record<ServiceRequest["severity"], "muted" | "info" | "warning" | "error"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

const LOGISTICS_CATEGORIES: Array<ServiceRequest["category"]> = ["cleaning", "repair", "other"];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.logistics.services.eyebrow", undefined, "Operations · Run")}
          title={t("console.logistics.services.title", undefined, "Services")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.logistics.services.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const all = (await listOrgScoped("service_requests", session.orgId, {
    orderBy: "opened_at",
    ascending: false,
    limit: 500,
  })) as ServiceRequest[];

  const rows = all.filter((r) => LOGISTICS_CATEGORIES.includes(r.category));
  const open = rows.filter((r) => !["resolved", "cancelled"].includes(r.request_state)).length;
  const breached = rows.filter((r) => r.sla_response_breached || r.sla_resolution_breached).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.services.eyebrow", undefined, "Operations · Run")}
        title={t("console.logistics.services.title", undefined, "Services")}
        subtitle={t(
          "console.logistics.services.subtitle",
          { count: rows.length, requestWord: rows.length === 1 ? "Request" : "Requests", open },
          `${rows.length} ${rows.length === 1 ? "Request" : "Requests"} · ${open} Open  · waste, cleaning, repairs`,
        )}
        action={
          <Button href="/studio/services/requests/new" size="sm">
            {t("console.logistics.services.newService", undefined, "+ New Service")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.logistics.services.metrics.open", undefined, "Open")}
            value={fmt.number(open)}
            accent
          />
          <MetricCard
            label={t("console.logistics.services.metrics.slaBreached", undefined, "SLA breached")}
            value={fmt.number(breached)}
          />
          <MetricCard
            label={t("console.logistics.services.metrics.total30d", undefined, "Total · 30d")}
            value={fmt.number(rows.length)}
          />
        </div>

        <DataView<ServiceRequest>
          rows={rows}
          rowHref={(r) => `/studio/services/requests/${r.id}`}
          emptyLabel={t("console.logistics.services.empty.label", undefined, "No logistics service requests")}
          emptyDescription={t(
            "console.logistics.services.empty.description",
            undefined,
            "Cleaning, waste, and repair tickets land here. Author one via /studio/services/requests.",
          )}
          emptyAction={
            <Button href="/studio/services/requests/new" size="sm">
              {t("console.logistics.services.newService", undefined, "+ New Service")}
            </Button>
          }
          columns={[
            {
              key: "summary",
              header: t("console.logistics.services.columns.summary", undefined, "Summary"),
              render: (r) => r.summary,
              accessor: (r) => r.summary,
            },
            {
              key: "category",
              header: t("console.logistics.services.columns.category", undefined, "Category"),
              render: (r) => <Badge variant="muted">{toTitle(r.category)}</Badge>,
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "severity",
              header: t("console.logistics.services.columns.severity", undefined, "Severity"),
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity]}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "opened",
              header: t("console.logistics.services.columns.opened", undefined, "Opened"),
              render: (r) => relativeTime(r.opened_at),
              mono: true,
              accessor: (r) => r.opened_at ?? null,
            },
            {
              key: "request_state",
              header: t("console.logistics.services.columns.request_state", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.request_state)}>{toTitle(r.request_state)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.request_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
