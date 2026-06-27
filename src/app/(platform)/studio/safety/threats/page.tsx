import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import type { Threat } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { SEVERITY_TONE, toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("threats", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows as Threat[];
  const total = result.totalCount;

  const active = rows.filter((r) => r.threat_state === "active").length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.threats.eyebrow", undefined, "Safety")}
        title={t("console.safety.threats.title", undefined, "Threat Register")}
        subtitle={`${total} ${total === 1 ? t("console.safety.threats.entrySingular", undefined, "entry") : t("console.safety.threats.entryPlural", undefined, "entries")} · ${active} ${t("console.safety.threats.activeLabel", undefined, "Active")}  · ${critical} ${t("console.safety.threats.criticalLabel", undefined, "critical")}`}
        action={
          <Button href="/studio/safety/threats/new" size="sm">
            {t("console.safety.threats.newThreat", undefined, "+ New Threat")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable<Threat>
          rows={rows}
          totalCount={total}
          emptyLabel={t("console.safety.threats.emptyLabel", undefined, "No threats logged")}
          emptyDescription={t(
            "console.safety.threats.emptyDescription",
            undefined,
            "Intel + threat assessments live here. Each entry carries a severity, likelihood, treatment, and classification level so distribution can be scoped.",
          )}
          emptyAction={
            <Button href="/studio/safety/threats/new" size="sm">
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
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>,
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
              key: "threat_state",
              header: t("console.safety.threats.col.threat_state", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.threat_state)}>{toTitle(r.threat_state)}</Badge>,
              accessor: (r) => r.threat_state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/threats"
          searchParams={sp}
        />
      </div>
    </>
  );
}
