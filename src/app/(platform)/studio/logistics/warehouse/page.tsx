import { getRequestT } from "@/lib/i18n/request";
import { AssetInventorySurface } from "@/components/assets/AssetInventorySurface";

export const dynamic = "force-dynamic";

/**
 * Warehouse Lots — a filtered lens over the unified asset registry (kit 20
 * Phase A: `warehouse → inventory as "Warehouse Lots"`). Quantity-bearing
 * storage lots are `assets.asset_class='lot'` rows with `qty` and
 * `disposition` facets; the old warehouse dashboards over the retired
 * `equipment` table are gone.
 */
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <AssetInventorySurface
      title={t("console.assets.lots.title", undefined, "Warehouse Lots")}
      classFilter="lot"
      subtitleHint={t(
        "console.assets.lots.subtitle",
        undefined,
        "Storage Lots & Bins · Quantity And Disposition Live On Each Lot",
      )}
    />
  );
}
