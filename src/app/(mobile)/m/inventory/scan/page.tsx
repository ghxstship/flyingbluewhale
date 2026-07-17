import { getRequestT } from "@/lib/i18n/request";
import { ScanSurface } from "../../check-in/ScanSurface";

export const dynamic = "force-dynamic";

/**
 * /m/inventory/scan — the shared Scan surface PRESET to the Asset
 * (inventory) mode, with a back link to /m/inventory (kit 29 §C route
 * policy: the route stays, rendering the shared scanner with the Inventory
 * preset — the former mode-locked InventoryScanner was a divergent
 * duplicate of the check-in scanner).
 */
export default async function InventoryScanPage() {
  const { t } = await getRequestT();
  return (
    <ScanSurface
      initialMode="asset"
      backHref="/m/inventory"
      backLabel={t("m.inventoryScan.back", undefined, "Assets")}
    />
  );
}
