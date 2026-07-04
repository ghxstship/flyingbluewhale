import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { AssetsTabs } from "@/components/assets/AssetsTabs";

export const dynamic = "force-dynamic";

/**
 * Pull Sheets — the printable pick lists of the asset domain. Each rental
 * (sub-rented gear moving in/out) renders a branded pull-sheet PDF via
 * `/api/v1/rentals/{id}/pull-sheet`; this tab is the index over them.
 */
export default async function Page() {
  const { t } = await getRequestT();
  const title = t("console.assets.pullSheets.title", undefined, "Pull Sheets");
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
  const [{ data: rentalRows }, { data: assetRows }, { data: projectRows }] = await Promise.all([
    supabase
      .from("rentals")
      .select("id, asset_id, project_id, starts_at, ends_at, notes")
      .eq("org_id", session.orgId)
      .order("starts_at", { ascending: false })
      .limit(200),
    supabase.from("assets").select("id, display_name, asset_tag").eq("org_id", session.orgId),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId),
  ]);
  const rentals = rentalRows ?? [];
  const assetName = new Map((assetRows ?? []).map((a) => [a.id, a] as const));
  const projectName = new Map((projectRows ?? []).map((p) => [p.id, p.name] as const));
  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Production · Build")}
        title={title}
        subtitle={t(
          "console.assets.pullSheets.subtitle",
          { count: rentals.length },
          `${rentals.length} Rental Windows · Each Renders A Branded Pick List`,
        )}
      />
      <div className="page-content space-y-5">
        <AssetsTabs active="/studio/assets/pull-sheets" />
        {rentals.length === 0 ? (
          <EmptyState
            title={t("console.assets.pullSheets.emptyTitle", undefined, "No pull sheets yet")}
            description={t(
              "console.assets.pullSheets.emptyDescription",
              undefined,
              "A pull sheet is generated for every rental window. Book a sub-rental and its pick list appears here.",
            )}
            action={
              <Button href="/studio/production/rentals/new" size="sm">
                {t("console.assets.pullSheets.emptyAction", undefined, "+ Book a rental")}
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">{t("console.assets.pullSheets.columns.asset", undefined, "Asset")}</th>
                  <th className="text-start">{t("console.assets.pullSheets.columns.project", undefined, "Project")}</th>
                  <th className="text-start">{t("console.assets.pullSheets.columns.window", undefined, "Window")}</th>
                  <th className="text-end">{t("console.assets.pullSheets.columns.sheet", undefined, "Pull Sheet")}</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => {
                  const asset = r.asset_id ? assetName.get(r.asset_id) : null;
                  return (
                    <tr key={r.id}>
                      <td>
                        {asset ? (
                          <a className="font-medium hover:underline" href={`/studio/assets/${r.asset_id}`}>
                            {asset.display_name}
                          </a>
                        ) : (
                          "—"
                        )}
                        {asset?.asset_tag && (
                          <span className="ms-2 font-mono text-xs text-[var(--p-text-2)]">{asset.asset_tag}</span>
                        )}
                      </td>
                      <td className="text-xs">{r.project_id ? (projectName.get(r.project_id) ?? "—") : "—"}</td>
                      <td className="font-mono text-xs">
                        {fmt(r.starts_at)} → {fmt(r.ends_at)}
                      </td>
                      <td className="text-end">
                        <a
                          className="text-xs font-medium text-[var(--p-accent-text,var(--p-accent))] hover:underline"
                          href={`/api/v1/rentals/${r.id}/pull-sheet`}
                        >
                          {t("console.assets.pullSheets.download", undefined, "Download PDF")}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
