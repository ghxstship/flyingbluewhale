import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /studio/workforce/labor-insights — projected labor cost vs budget revenue.
 * Connecteam May 2026 "Projected Sales & Projected Labor %" parity.
 *
 * Computes from live time_entries (this calendar month) and org budgets:
 *   - Total hours worked
 *   - Estimated labor cost (hours × avg crew hourly rate from crew_members.hourly_rate_cents)
 *   - Active budget revenue target (sum of budgets.total_revenue_cents for active projects)
 *   - Labor cost % of projected revenue
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.laborInsights.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.laborInsights.title", undefined, "Labor Insights")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.laborInsights.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Current month window.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // 1. Hours logged this month.
  const { data: entries } = await supabase
    .from("time_entries")
    .select("duration_minutes, user_id")
    .eq("org_id", session.orgId)
    .not("ended_at", "is", null)
    .gte("started_at", monthStart)
    .lte("started_at", monthEnd);

  const totalMinutes = ((entries ?? []) as Array<{ duration_minutes: number | null }>).reduce(
    (s, e) => s + (e.duration_minutes ?? 0),
    0,
  );
  const totalHours = totalMinutes / 60;

  const uniqueUserIds = Array.from(
    new Set(((entries ?? []) as Array<{ user_id: string }>).map((e) => e.user_id)),
  );

  // 2. Avg hourly rate from crew_members (best-effort).
  let avgRateCents = 0;
  if (uniqueUserIds.length) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("hourly_rate_cents")
      .eq("org_id", session.orgId)
      .in("user_id", uniqueUserIds)
      .not("hourly_rate_cents", "is", null);
    const rates = ((crew ?? []) as Array<{ hourly_rate_cents: number }>).map((c) => c.hourly_rate_cents);
    if (rates.length) avgRateCents = rates.reduce((s, r) => s + r, 0) / rates.length;
  }
  const estimatedLaborCents = Math.round(totalHours * avgRateCents);

  // 3. Active budget revenue this month.
  const { data: budgets } = await supabase
    .from("budgets")
    .select("total_revenue_cents")
    .eq("org_id", session.orgId)
    .not("total_revenue_cents", "is", null);

  const totalRevenueCents = ((budgets ?? []) as Array<{ total_revenue_cents: number }>).reduce(
    (s, b) => s + b.total_revenue_cents,
    0,
  );

  const laborPct =
    totalRevenueCents > 0
      ? ((estimatedLaborCents / totalRevenueCents) * 100).toFixed(1)
      : null;

  // 4. Per-project breakdown.
  const { data: projectEntries } = await supabase
    .from("time_entries")
    .select("project_id, duration_minutes")
    .eq("org_id", session.orgId)
    .not("ended_at", "is", null)
    .not("project_id", "is", null)
    .gte("started_at", monthStart)
    .lte("started_at", monthEnd);

  const byProject = new Map<string, number>();
  for (const e of (projectEntries ?? []) as Array<{ project_id: string; duration_minutes: number | null }>) {
    byProject.set(e.project_id, (byProject.get(e.project_id) ?? 0) + (e.duration_minutes ?? 0));
  }

  const projectIds = Array.from(byProject.keys());
  const projectNames = new Map<string, string>();
  if (projectIds.length) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .in("id", projectIds);
    for (const p of (projects ?? []) as Array<{ id: string; name: string | null }>) {
      projectNames.set(p.id, p.name ?? "—");
    }
  }

  const projectRows = Array.from(byProject.entries())
    .map(([id, mins]) => ({
      name: projectNames.get(id) ?? "—",
      hours: (mins / 60).toFixed(1),
      estimatedCostCents: Math.round((mins / 60) * avgRateCents),
    }))
    .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
    .slice(0, 10);

  const hasData = totalMinutes > 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.laborInsights.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.laborInsights.title", undefined, "Labor Insights")}
        subtitle={t(
          "console.workforce.laborInsights.subtitle",
          { month: fmt.dateParts(monthStart, { month: "long", year: "numeric" }) },
          `Projected labor cost vs. revenue — ${fmt.dateParts(monthStart, { month: "long", year: "numeric" })}`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.laborInsights.metric.hours", undefined, "Hours Logged")}
            value={totalHours.toFixed(1)}
          />
          <MetricCard
            label={t("console.workforce.laborInsights.metric.cost", undefined, "Est. Labor Cost")}
            value={
              estimatedLaborCents > 0
                ? `$${(estimatedLaborCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                : avgRateCents === 0
                  ? t("console.workforce.laborInsights.noRates", undefined, "Set hourly rates")
                  : "$0"
            }
            accent
          />
          <MetricCard
            label={t("console.workforce.laborInsights.metric.pct", undefined, "Labor % of Revenue")}
            value={laborPct !== null ? `${laborPct}%` : "—"}
            trend={laborPct !== null && parseFloat(laborPct) > 35 ? ("down" as const) : undefined}
          />
        </div>

        {totalRevenueCents > 0 && (
          <div className="metric-grid-2">
            <MetricCard
              label={t("console.workforce.laborInsights.metric.revenue", undefined, "Active Budget Revenue")}
              value={`$${(totalRevenueCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            />
            <MetricCard
              label={t("console.workforce.laborInsights.metric.headcount", undefined, "Active Crew")}
              value={fmt.number(uniqueUserIds.length)}
            />
          </div>
        )}

        {!hasData ? (
          <EmptyState
            title={t("console.workforce.laborInsights.empty.title", undefined, "No hours logged this month")}
            description={t(
              "console.workforce.laborInsights.empty.body",
              undefined,
              "Hours logged by crew this calendar month appear here with projected labor cost vs. budget.",
            )}
          />
        ) : projectRows.length > 0 ? (
          <div className="surface p-5">
            <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {t("console.workforce.laborInsights.byProject", undefined, "By Project — Top 10")}
            </h2>
            <div className="data-table" style={{ fontSize: 13 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 10px", color: "var(--p-text-2)", fontWeight: 500 }}>
                      {t("console.workforce.laborInsights.col.project", undefined, "Project")}
                    </th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "var(--p-text-2)", fontWeight: 500 }}>
                      {t("console.workforce.laborInsights.col.hours", undefined, "Hours")}
                    </th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "var(--p-text-2)", fontWeight: 500 }}>
                      {t("console.workforce.laborInsights.col.est", undefined, "Est. Cost")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--p-border)" }}>
                      <td style={{ padding: "8px 10px" }}>{r.name}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {r.hours}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {avgRateCents > 0
                          ? `$${(r.estimatedCostCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {avgRateCents === 0 && (
              <p style={{ marginTop: 10, fontSize: 12, color: "var(--p-text-3)" }}>
                {t(
                  "console.workforce.laborInsights.noRateHint",
                  undefined,
                  "Set hourly_rate_cents on crew members to unlock cost estimates.",
                )}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
