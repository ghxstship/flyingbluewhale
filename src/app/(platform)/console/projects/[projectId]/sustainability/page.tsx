import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
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
        eyebrow="Project"
        title="Sustainability"
        subtitle="Carbon emissions tracked at organization level (per-project attribution coming)."
      />
      <div className="page-content space-y-5">
        {!rows || rows.length === 0 ? (
          <EmptyState
            title="No Metrics Yet"
            description="No sustainability metrics have been recorded for this organization. Log emissions from the Sustainability module."
          />
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard label="Scope 1" value={`${(byScope[1] ?? 0).toFixed(0)} kg CO₂e`} />
              <MetricCard label="Scope 2" value={`${(byScope[2] ?? 0).toFixed(0)} kg CO₂e`} />
              <MetricCard label="Scope 3" value={`${(byScope[3] ?? 0).toFixed(0)} kg CO₂e`} />
              <MetricCard label="Total" value={`${total.toFixed(0)} kg CO₂e`} accent />
            </div>
            <div className="surface p-4 text-xs text-[var(--text-muted)]">
              Per-project attribution requires adding a <code className="font-mono">project_id</code> column to{" "}
              <code className="font-mono">sustainability_metrics</code>. Until then, this tab shows the org-level rollup
              as a transparency stub.
            </div>
          </>
        )}
      </div>
    </>
  );
}
