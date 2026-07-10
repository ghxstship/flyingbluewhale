export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import Link from "next/link";
import { rollupCoordinate, rollupToData, COORDINATE_METRIC_LABELS, COORDINATE_METRICS } from "@/lib/xpms/coordinate";
import { XPMS_CLASS_BY_CODE, XPMS_ATOM_PHASES } from "@/lib/xpms";
import { PositionMatrix } from "@/components/coordinate/PositionMatrix";

/**
 * §9.1 Portfolio altitude — "Position" / "The Chart". The class × phase lens
 * across every active project in the org, for execs and resource managers. A
 * hot cell is a precise org-wide bottleneck. Display-only (no drill — cells are
 * cross-project here); the project overview is the drill-down home.
 */
export default async function PositionPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const rollups = await rollupCoordinate(session.orgId);
  const open = rollups.open;
  const value = rollups.value;

  const peakLabel = open.peak
    ? `${XPMS_CLASS_BY_CODE[open.peak.classCode]?.name ?? open.peak.classCode} × ${
        XPMS_ATOM_PHASES.find((p) => p.id === open.peak?.phase)?.label ?? open.peak.phase
      }`
    : "—";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.position.eyebrow", undefined, "The Chart")}
        title={t("console.position.title", undefined, "Position")}
        subtitle={t("console.position.subtitle", undefined, "Class × phase across all active projects")}
        breadcrumbs={[{ label: t("console.position.title", undefined, "Position") }]}
      />
      <div className="page-content max-w-6xl space-y-6">
        {open.total === 0 ? (
          <EmptyState
            title={t("console.position.emptyTitle", undefined, "No coordinates plotted yet")}
            description={t(
              "console.position.emptyDescription",
              undefined,
              "Once projects carry XPMS atoms (class × phase), the portfolio heat grid lights up here. Each hot cell a precise bottleneck.",
            )}
          />
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard label={t("console.position.metricItems", undefined, "Open items")} value={String(open.total)} />
              <MetricCard
                label={t("console.position.metricValue", undefined, "$ exposure")}
                value={`$${fmt.number(Math.round(value.total))}`}
              />
              <MetricCard label={t("console.position.metricPeak", undefined, "Hottest cell")} value={peakLabel} />
            </div>
            <div className="surface p-4">
              <div className="mb-3 flex items-center justify-end">
                <Link href="/studio/position/forecast" className="text-xs font-medium text-[var(--p-accent)]">
                  {t("console.position.forecastLabel", undefined, "Workload forecast →")}
                </Link>
              </div>
              <PositionMatrix
                data={rollupToData(rollups)}
                metrics={COORDINATE_METRICS.map((id) => ({ id, label: COORDINATE_METRIC_LABELS[id] }))}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
