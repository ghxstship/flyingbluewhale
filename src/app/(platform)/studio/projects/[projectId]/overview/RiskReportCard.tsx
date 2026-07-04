import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getLatestRiskReport, type RiskOverall } from "@/lib/ai/risk-report";
import { getRequestT } from "@/lib/i18n/request";
import { GenerateRiskReportButton } from "./GenerateRiskReportButton";

/**
 * AI risk report card on the project overview (competitive-scan 2026-07
 * delta — Asana "AI Risk Reports" parity). Server component: reads the
 * newest persisted ai_risk_reports row; generation happens through the
 * client island's server action and revalidates this page.
 */

const OVERALL_VARIANT: Record<RiskOverall, BadgeVariant> = {
  low: "success",
  moderate: "warning",
  high: "error",
  critical: "error",
};

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  low: "muted",
  medium: "warning",
  high: "error",
};

export async function RiskReportCard({ projectId, orgId }: { projectId: string; orgId: string }) {
  const { t } = await getRequestT();
  const latest = await getLatestRiskReport(orgId, projectId);

  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">
          {t("console.projects.overview.risk.title", undefined, "AI Risk Assessment")}
        </div>
        {latest && (
          <Badge variant={OVERALL_VARIANT[latest.report.overall]}>
            {latest.report.overall.toUpperCase()}
          </Badge>
        )}
      </div>

      {latest ? (
        <div className="space-y-4">
          <p className="text-sm">{latest.report.headline}</p>

          {latest.report.risks.length > 0 && (
            <ul className="space-y-3">
              {latest.report.risks.map((r, i) => (
                <li key={i} className="rounded-[var(--p-r-md)] border border-[var(--p-border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
                        {r.area}
                      </span>
                      <Badge variant={SEVERITY_VARIANT[r.severity] ?? "muted"}>{r.severity}</Badge>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">{r.evidence}</p>
                  <p className="mt-1 text-xs">
                    <span className="font-medium">
                      {t("console.projects.overview.risk.mitigation", undefined, "Mitigation")}:
                    </span>{" "}
                    {r.mitigation}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {latest.report.watchlist.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">
                {t("console.projects.overview.risk.watchlist", undefined, "Watchlist")}
              </div>
              <ul className="mt-1 list-disc pl-4 text-xs text-[var(--p-text-2)]">
                {latest.report.watchlist.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--p-text-3)]">
              {t(
                "console.projects.overview.risk.generatedAt",
                { date: new Date(latest.createdAt).toLocaleString() },
                `Generated ${new Date(latest.createdAt).toLocaleString()}`,
              )}
            </span>
            <GenerateRiskReportButton projectId={projectId} hasReport />
          </div>
        </div>
      ) : (
        <EmptyState
          size="compact"
          title={t("console.projects.overview.risk.emptyTitle", undefined, "No assessment yet")}
          description={t(
            "console.projects.overview.risk.empty",
            undefined,
            "Generate one to grade schedule pressure, overdue work, budget variance, incidents, and stalled advancing from this project's live signals.",
          )}
          action={<GenerateRiskReportButton projectId={projectId} hasReport={false} />}
        />
      )}
    </div>
  );
}
