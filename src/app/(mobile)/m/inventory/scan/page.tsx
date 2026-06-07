import { getRequestT } from "@/lib/i18n/request";
import { InventoryScanner } from "./InventoryScanner";

export default async function InventoryScanPage() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.inventory.scan.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.inventory.scan.title", undefined, "Inventory Scan")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.inventory.scan.subtitle", undefined, "Scan or type an asset tag to check in / out.")}
      </p>
      <div className="mt-6">
        <InventoryScanner />
      </div>
    </div>
  );
}
