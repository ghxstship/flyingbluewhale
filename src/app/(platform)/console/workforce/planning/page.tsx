import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Planning" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

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
  const byFA = rows.reduce<Map<string, { planned: number; actual: number; rows: DeploymentRow[] }>>((map, r) => {
    const fa = r.functional_area ?? "Unspecified";
    if (!map.has(fa)) map.set(fa, { planned: 0, actual: 0, rows: [] });
    const acc = map.get(fa)!;
    acc.planned += r.planned_fte;
    acc.actual += r.actual_fte;
    acc.rows.push(r);
    return map;
  }, new Map());
  const faEntries = Array.from(byFA.entries()).sort((a, b) => b[1].planned - a[1].planned);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Planning"
        subtitle={`${rows.length} deployment${rows.length === 1 ? "" : "s"} · ${totalActual.toLocaleString()} / ${totalPlanned.toLocaleString()} FTE${fillRate != null ? ` · ${fillRate}% filled` : ""}`}
        action={
          <Button href="/console/workforce/deployment" size="sm">
            Open deployment
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Planned FTE" value={totalPlanned.toLocaleString()} accent />
          <MetricCard label="Actual FTE" value={totalActual.toLocaleString()} />
          <MetricCard label="Fill rate" value={fillRate != null ? `${fillRate}%` : "—"} />
        </div>

        {faEntries.length === 0 ? (
          <EmptyState
            title="No deployments planned"
            description="Author workforce_deployments rows per venue+zone+window to drive headcount planning."
            action={
              <Link href="/console/workforce/deployment" className="btn btn-secondary btn-sm">
                Open deployment
              </Link>
            }
          />
        ) : (
          <section>
            <h3 className="text-sm font-semibold">By functional area</h3>
            <div className="mt-3 space-y-3">
              {faEntries.map(([fa, agg]) => {
                const fr = agg.planned > 0 ? Math.round((agg.actual / agg.planned) * 100) : null;
                return (
                  <div key={fa} className="surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">{fa}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="muted">
                          {agg.actual} / {agg.planned} FTE
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
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {d.actual_fte}/{d.planned_fte}
                              {dr != null ? ` (${dr}%)` : ""}
                            </span>
                          </li>
                        );
                      })}
                      {agg.rows.length > 6 && (
                        <li className="text-xs text-[var(--text-muted)]">+{agg.rows.length - 6} more</li>
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
