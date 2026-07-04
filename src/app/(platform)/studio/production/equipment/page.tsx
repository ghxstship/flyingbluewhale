import { getRequestT } from "@/lib/i18n/request";
import { AssetInventorySurface } from "@/components/assets/AssetInventorySurface";

export const dynamic = "force-dynamic";

/**
 * Fleet — a filtered lens over the unified asset registry (kit 20 Phase A:
 * `equipment → inventory as "Fleet"`). The old `equipment` table folded into
 * `assets` as `asset_class='fleet'` in migration 20260703120000; this route
 * stays as the lens so bookmarks, nav history, and the Fleet tab all land on
 * the same store.
 */
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <AssetInventorySurface
      title={t("console.assets.fleet.title", undefined, "Fleet")}
      classFilter="fleet"
      subtitleHint={t(
        "console.assets.fleet.subtitle",
        undefined,
        "Heavy Fleet & Owned Gear · A Class Lens Over The Unified Asset Registry",
      )}
    />
  );
}
