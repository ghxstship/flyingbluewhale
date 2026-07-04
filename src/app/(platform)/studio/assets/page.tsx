import { getRequestT } from "@/lib/i18n/request";
import { AssetInventorySurface } from "@/components/assets/AssetInventorySurface";

export const dynamic = "force-dynamic";

/**
 * Assets & Inventory · Registry — the unified physical-asset store
 * (kit 20 Phase A). Gear, Fleet, and Lots are `asset_class` lenses over
 * this one table; the tab family carries every sub-surface.
 */
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <AssetInventorySurface
      title={t("console.assets.title", undefined, "Assets & Inventory")}
      activeTab="/studio/assets"
    />
  );
}
