import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Threat } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const SEVERITY_TONE: Record<Threat["severity"], "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
  critical: "error",
};

const STATUS_TONE: Record<Threat["status"], "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  active: "info",
  closed: "success",
  superseded: "warning",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.threats.eyebrow", undefined, "Safety")}
          title={t("console.safety.threats.title", undefined, "Threat Register")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.threats.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("threats", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  })) as Threat[];

  const active = rows.filter((r) => r.status === "active").length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.threats.eyebrow", undefined, "Safety")}
        title={t("console.safety.threats.title", undefined, "Threat Register")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.safety.threats.entrySingular", undefined, "entry") : t("console.safety.threats.entryPlural", undefined, "entries")} · ${active} ${t("console.safety.threats.activeLabel", undefined, "Active")}  · ${critical} ${t("console.safety.threats.criticalLabel", undefined, "critical")}`}
        action={
          <Button href="/console/safety/threats/new" size="sm">
            {t("console.safety.threats.newThreat", undefined, "+ New Threat")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Threat>
          rows={rows}
          emptyLabel={t("console.safety.threats.emptyLabel", undefined, "No threats logged")}
          emptyDescription={t(
            "console.safety.threats.emptyDescription",
            undefined,
            "Intel + threat assessments live here. Each entry carries a severity, likelihood, treatment, and classification level so distribution can be scoped.",
          )}
          emptyAction={
            <Button href="/console/safety/threats/new" size="sm">
              {t("console.safety.threats.newThreat", undefined, "+ New Threat")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.safety.threats.col.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "title",
              header: t("console.safety.threats.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "severity",
              header: t("console.safety.threats.col.severity", undefined, "Severity"),
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity]}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "likelihood",
              header: t("console.safety.threats.col.likelihood", undefined, "Likelihood"),
              render: (r) => toTitle(r.likelihood),
              accessor: (r) => r.likelihood ?? null,
            },
            {
              key: "treatment",
              header: t("console.safety.threats.col.treatment", undefined, "Treatment"),
              render: (r) => r.treatment,
              accessor: (r) => r.treatment,
            },
            {
              key: "classification",
              header: t("console.safety.threats.col.classification", undefined, "Classification"),
              render: (r) => <Badge variant="muted">{r.classification}</Badge>,
              accessor: (r) => r.classification ?? null,
            },
            {
              key: "status",
              header: t("console.safety.threats.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{toTitle(r.status)}</Badge>,
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
