import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  display_name: string;
  asset_kind: string;
  state: string;
  serial: string | null;
  asset_tag: string | null;
  acquisition_cost_minor: number | null;
  acquisition_currency: string | null;
};

function money(minor: number | null, currency: string | null): string {
  if (minor == null) return "—";
  return (minor / 100).toLocaleString("en-US", { style: "currency", currency: currency ?? "USD" });
}

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
          eyebrow={t("console.assets.eyebrow", undefined, "Asset & Logistics")}
          title={t("console.assets.title", undefined, "Assets")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.assets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("assets", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows as AssetRow[];
  const total = result.totalCount;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Asset & Logistics")}
        title={t("console.assets.title", undefined, "Assets")}
        subtitle={t(
          "console.assets.subtitle",
          { count: total },
          `${total} tracked assets across the org`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/assets/warranties" size="sm" variant="ghost">
              {t("console.assets.warrantiesLink", undefined, "Warranties")}
            </Button>
            <Button href="/studio/assets/new" size="sm">
              {t("console.assets.newAsset", undefined, "+ New asset")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.assets.emptyTitle", undefined, "No assets yet")}
            description={t(
              "console.assets.emptyDescription",
              undefined,
              "Track owned, leased, rented, or sub-hired gear with acquisition cost, depreciation, and maintenance history.",
            )}
            action={
              <Button href="/studio/assets/new" size="sm">
                {t("console.assets.newAsset", undefined, "+ New asset")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-start">{t("console.assets.columns.name", undefined, "Asset")}</th>
                  <th className="text-start">{t("console.assets.columns.kind", undefined, "Kind")}</th>
                  <th className="text-start">{t("console.assets.columns.state", undefined, "State")}</th>
                  <th className="text-start">{t("console.assets.columns.serial", undefined, "Serial / Tag")}</th>
                  <th className="text-end">{t("console.assets.columns.cost", undefined, "Acquisition")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <a className="font-medium hover:underline" href={`/studio/assets/${r.id}`}>
                        {r.display_name}
                      </a>
                    </td>
                    <td>
                      <Badge variant="muted">{toTitle(r.asset_kind)}</Badge>
                    </td>
                    <td>
                      <StatusBadge status={r.state} />
                    </td>
                    <td className="font-mono text-xs">{r.serial || r.asset_tag || "—"}</td>
                    <td className="text-end font-mono">{money(r.acquisition_cost_minor, r.acquisition_currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PagerNav
            page={page}
            total={total}
            pageSize={pageSize}
            basePath="/studio/assets"
            searchParams={sp}
          />
          </div>
        )}
      </div>
    </>
  );
}
