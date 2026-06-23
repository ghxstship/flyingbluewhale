import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type DeploymentRow = {
  id: string;
  planned_fte: number;
  actual_fte: number;
  functional_area: string | null;
  shift_window: string | null;
  venue: { name: string | null } | null;
  zone: { name: string | null; code: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.planning.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.planning.title", undefined, "Planning")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.planning.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("workforce_deployments")
    .select(
      "id, planned_fte, actual_fte, functional_area, shift_window, venue:venue_id(name), zone:zone_id(name, code)",
    )
    .eq("org_id", session.orgId)
    .order("functional_area", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as unknown as DeploymentRow[];
  const totalPlanned = rows.reduce((s, r) => s + r.planned_fte, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual_fte, 0);
  const fillRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : null;

  // Roll up by functional area
  const unspecifiedLabel = t("console.workforce.planning.unspecified", undefined, "Unspecified");
  const byFA = rows.reduce<Map<string, { planned: number; actual: number; rows: DeploymentRow[] }>>((map, r) => {
    const fa = r.functional_area ?? unspecifiedLabel;
    if (!map.has(fa)) map.set(fa, { planned: 0, actual: 0, rows: [] });
    const acc = map.get(fa)!;
    acc.planned += r.planned_fte;
    acc.actual += r.actual_fte;
    acc.rows.push(r);
    return map;
  }, new Map());
  const faEntries = Array.from(byFA.entries()).sort((a, b) => b[1].planned - a[1].planned);

  const deploymentsLabel =
    rows.length === 1
      ? t("console.workforce.planning.deploymentSingular", undefined, "deployment")
      : t("console.workforce.planning.deploymentPlural", undefined, "deployments");
  const filledSuffix =
    fillRate != null
      ? ` · ${t("console.workforce.planning.filledSuffix", { pct: fillRate }, `${fillRate}% filled`)}`
      : "";
  const subtitle = `${rows.length} ${deploymentsLabel} · ${fmt.number(totalActual)} / ${fmt.number(totalPlanned)} FTE${filledSuffix}`;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.planning.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.planning.title", undefined, "Planning")}
        subtitle={subtitle}
        action={
          <Button href="/studio/workforce/deployment" size="sm">
            {t("console.workforce.planning.openDeployment", undefined, "Open deployment")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.planning.plannedFte", undefined, "Planned FTE")}
            value={fmt.number(totalPlanned)}
            accent
          />
          <MetricCard
            label={t("console.workforce.planning.actualFte", undefined, "Actual FTE")}
            value={fmt.number(totalActual)}
          />
          <MetricCard
            label={t("console.workforce.planning.fillRate", undefined, "Fill Rate")}
            value={fillRate != null ? `${fillRate}%` : "—"}
          />
        </div>

        {faEntries.length === 0 ? (
          <EmptyState
            title={t("console.workforce.planning.emptyTitle", undefined, "No Deployments Planned")}
            description={t(
              "console.workforce.planning.emptyDescription",
              undefined,
              "Author workforce_deployments rows per venue+zone+window to drive headcount planning.",
            )}
            action={
              <Link href="/studio/workforce/deployment" className="ps-btn ps-btn--ghost ps-btn--sm">
                {t("console.workforce.planning.openDeployment", undefined, "Open deployment")}
              </Link>
            }
          />
        ) : (
          <section>
            <h3 className="text-sm font-semibold">
              {t("console.workforce.planning.byFunctionalArea", undefined, "By Functional Area")}
            </h3>
            <div className="mt-3 space-y-3">
              {faEntries.map(([fa, agg]) => {
                const fr = agg.planned > 0 ? Math.round((agg.actual / agg.planned) * 100) : null;
                return (
                  <div key={fa} className="surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">{fa}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="muted">
                          {agg.actual} / {agg.planned} {t("console.workforce.planning.fteUnit", undefined, "FTE")}
                        </Badge>
                        {fr != null && (
                          <Badge variant={fr >= 90 ? "success" : fr >= 70 ? "warning" : "error"}>{fr}%</Badge>
                        )}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm">
                      {agg.rows.slice(0, 6).map((d) => {
                        const dr = d.planned_fte > 0 ? Math.round((d.actual_fte / d.planned_fte) * 100) : null;
                        return (
                          <li key={d.id} className="flex items-center justify-between">
                            <span>
                              {d.venue?.name ?? "—"}
                              {d.zone?.name ? ` · ${d.zone.name}` : ""}
                            </span>
                            <span className="font-mono text-xs text-[var(--p-text-2)]">
                              {d.actual_fte}/{d.planned_fte}
                              {dr != null ? ` (${dr}%)` : ""}
                            </span>
                          </li>
                        );
                      })}
                      {agg.rows.length > 6 && (
                        <li className="text-xs text-[var(--p-text-2)]">
                          +
                          {t(
                            "console.workforce.planning.moreCount",
                            { count: agg.rows.length - 6 },
                            `${agg.rows.length - 6} more`,
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
