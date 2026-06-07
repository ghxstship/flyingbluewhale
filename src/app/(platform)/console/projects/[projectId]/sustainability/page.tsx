import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  // sustainability_metrics is org-scoped today (no project_id column).
  // Per-project attribution is a follow-on data model change. Surface
  // the org-level rollup here with a transparency note.
  const { data: rows } = await supabase
    .from("sustainability_metrics")
    .select("scope,kg_co2e,period_start,period_end,source,method")
    .eq("org_id", session.orgId)
    .order("period_start", { ascending: false })
    .limit(50);

  const byScope = (rows ?? []).reduce<Record<number, number>>((acc, r) => {
    acc[r.scope] = (acc[r.scope] ?? 0) + Number(r.kg_co2e);
    return acc;
  }, {});
  const total = Object.values(byScope).reduce((s, v) => s + v, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.projects.sustainability.eyebrow", undefined, "Project")}
        title={t("console.projects.sustainability.title", undefined, "Sustainability")}
        subtitle={t("console.projects.sustainability.subtitle", undefined, "Carbon emissions at the org level.")}
      />
      <div className="page-content space-y-5">
        {!rows || rows.length === 0 ? (
          <EmptyState
            title={t("console.projects.sustainability.empty.title", undefined, "No Metrics Yet")}
            description={t(
              "console.projects.sustainability.empty.description",
              undefined,
              "No sustainability metrics have been recorded for this organization. Log emissions from the Sustainability module.",
            )}
          />
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard
                label={t("console.projects.sustainability.metrics.scope1", undefined, "Scope 1")}
                value={`${(byScope[1] ?? 0).toFixed(0)} kg CO₂e`}
              />
              <MetricCard
                label={t("console.projects.sustainability.metrics.scope2", undefined, "Scope 2")}
                value={`${(byScope[2] ?? 0).toFixed(0)} kg CO₂e`}
              />
              <MetricCard
                label={t("console.projects.sustainability.metrics.scope3", undefined, "Scope 3")}
                value={`${(byScope[3] ?? 0).toFixed(0)} kg CO₂e`}
              />
              <MetricCard
                label={t("console.projects.sustainability.metrics.total", undefined, "Total")}
                value={`${total.toFixed(0)} kg CO₂e`}
                accent
              />
            </div>
            <div className="surface p-4 text-xs text-[var(--p-text-2)]">
              {t(
                "console.projects.sustainability.transparencyNote",
                undefined,
                "Per-project attribution is in progress. Until then, this tab shows the org-level rollup as a transparency stub.",
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
