import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Rental } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.production.rentals.title", undefined, "Sub-Rentals")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.rentals.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  // Exact count alongside the capped window (F-01) — subtitle + truncation
  // indicator stay honest past the 100-row cap.
  const { rows, totalCount } = await listOrgScopedWithCount("rentals", session.orgId, {
    orderBy: "starts_at",
  });
  const supabase = await createClient();
  const assetIds = Array.from(new Set(rows.map((r) => r.asset_id).filter(Boolean)));
  const { data: assets } = assetIds.length
    ? await supabase.from("assets").select("id, display_name, asset_tag").in("id", assetIds)
    : { data: [] as { id: string; display_name: string; asset_tag: string | null }[] };
  const assetById = new Map((assets ?? []).map((a) => [a.id, a]));
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.eyebrow", undefined, "Production")}
        title={t("console.production.rentals.title", undefined, "Sub-Rentals")}
        subtitle={t("console.production.rentals.subtitle", { count: totalCount }, `${totalCount} Active  rentals`)}
        action={
          <Button href="/studio/production/rentals/new">
            {t("console.production.rentals.newRental", undefined, "+ New Rental")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Rental>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/production/rentals/${r.id}`}
          emptyLabel={t("console.production.rentals.emptyLabel", undefined, "No active rentals")}
          emptyDescription={t(
            "console.production.rentals.emptyDescription",
            undefined,
            "A rental records when an asset is reserved or out of the warehouse for a date range.",
          )}
          emptyAction={
            <Button href="/studio/production/rentals/new" size="sm">
              {t("console.production.rentals.newRental", undefined, "+ New Rental")}
            </Button>
          }
          columns={[
            {
              key: "asset_id",
              header: t("console.production.rentals.columns.asset", undefined, "Asset"),
              render: (r) => {
                const asset = assetById.get(r.asset_id);
                return (
                  <Link href={`/studio/assets/${r.asset_id}`} className="hover:underline">
                    {asset?.display_name ?? r.asset_id.slice(0, 8)}
                  </Link>
                );
              },
              accessor: (r) => assetById.get(r.asset_id)?.display_name ?? r.asset_id,
            },
            {
              key: "starts",
              header: t("console.production.rentals.columns.starts", undefined, "Starts"),
              render: (r) => formatDate(r.starts_at, "long"),
              mono: true,
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: t("console.production.rentals.columns.ends", undefined, "Ends"),
              render: (r) => formatDate(r.ends_at, "long"),
              mono: true,
              accessor: (r) => r.ends_at,
            },
            {
              key: "rate",
              header: t("console.production.rentals.columns.rate", undefined, "Rate"),
              render: (r) => formatMoney(r.rate_cents),
              mono: true,
              accessor: (r) => Number(r.rate_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
