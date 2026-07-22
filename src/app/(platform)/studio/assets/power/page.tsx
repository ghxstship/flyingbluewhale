import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ASSET_CLASS_LABELS } from "@/lib/db/assets";
import type { Asset } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const POWER_KINDS = ["power", "generator", "distro", "electrical", "ups", "cable"];

function isPowerKind(kind: string): boolean {
  const k = kind.toLowerCase();
  return POWER_KINDS.some((p) => k.includes(p));
}

/**
 * Power Plan — the power-kind lens over the unified registry: generators,
 * distros, and electrical inventory grouped by location so a site
 * electrician can see what feeds what. Rows come straight from `assets`
 * (kind facet); nothing here is a second store.
 */
export default async function Page() {
  const { t } = await getRequestT();
  const title = t("console.assets.power.title", undefined, "Power Plan");
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={title} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.assets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: assetRows }, { data: locationRows }] = await Promise.all([
    supabase
      .from("assets")
      .select("id, display_name, asset_kind, asset_class, state, qty, location_id, asset_tag")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("display_name", { ascending: true })
      .limit(1000),
    supabase.from("locations").select("id, name").eq("org_id", session.orgId),
  ]);
  const rows = ((assetRows ?? []) as unknown as Asset[]).filter((r) => isPowerKind(r.asset_kind));
  const locationName = new Map((locationRows ?? []).map((l) => [l.id, l.name] as const));
  const deployed = rows.filter((r) => r.state === "in_use").length;
  const staged = rows.filter((r) => r.state === "available" || r.state === "reserved").length;
  const totalUnits = rows.reduce((sum, r) => sum + (r.qty ?? 1), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Production · Build")}
        title={title}
        subtitle={t(
          "console.assets.power.subtitle",
          { count: rows.length },
          `${rows.length} Power Assets · Generators, Distros & Electrical Inventory By Location`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <MetricCard
            label={t("console.assets.power.stat.assets", undefined, "Power Assets")}
            value={String(rows.length)}
          />
          <MetricCard
            label={t("console.assets.power.stat.units", undefined, "Total Units")}
            value={String(totalUnits)}
          />
          <MetricCard label={t("console.assets.power.stat.deployed", undefined, "Deployed")} value={String(deployed)} />
          <MetricCard label={t("console.assets.power.stat.staged", undefined, "Staged")} value={String(staged)} />
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.assets.power.emptyTitle", undefined, "No power assets yet")}
            description={t(
              "console.assets.power.emptyDescription",
              undefined,
              "Add generators, distros, and cable stock to the registry with a power kind and they roll up here by location.",
            )}
            action={
              <Button href="/studio/assets/new" size="sm">
                {t("console.assets.addAssetLower", undefined, "+ Add asset")}
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">{t("console.assets.power.columns.asset", undefined, "Asset")}</th>
                  <th className="text-start">{t("console.assets.power.columns.kind", undefined, "Kind")}</th>
                  <th className="text-start">{t("console.assets.power.columns.class", undefined, "Class")}</th>
                  <th className="text-end">{t("console.assets.power.columns.qty", undefined, "Qty")}</th>
                  <th className="text-start">{t("console.assets.power.columns.location", undefined, "Location")}</th>
                  <th className="text-start">{t("console.assets.power.columns.state", undefined, "State")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <a className="font-medium hover:underline" href={`/studio/assets/${r.id}`}>
                        {r.display_name}
                      </a>
                      {r.asset_tag && (
                        <span className="ms-2 font-mono text-xs text-[var(--p-text-2)]">{r.asset_tag}</span>
                      )}
                    </td>
                    <td className="text-xs">{toTitle(r.asset_kind)}</td>
                    <td className="text-xs">{ASSET_CLASS_LABELS[r.asset_class]}</td>
                    <td className="text-end font-mono text-xs">{r.qty}</td>
                    <td className="text-xs">{r.location_id ? (locationName.get(r.location_id) ?? "—") : "—"}</td>
                    <td>
                      <StatusBadge status={r.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
