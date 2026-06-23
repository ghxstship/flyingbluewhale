import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Equipment detail layout — Maintenance jobs and rentals filter by
 * equipment_id; QR sub-route already exists for chain-of-custody
 * scanning.
 */
export default async function EquipmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  const { t } = await getRequestT();
  const tabs = [
    {
      label: t("console.production.equipment.detail.tabs.overview", undefined, "Overview"),
      href: `/studio/production/equipment/${equipmentId}`,
    },
    {
      label: t("console.production.equipment.detail.tabs.maintenance", undefined, "Maintenance"),
      href: `/studio/production/equipment/${equipmentId}/maintenance`,
    },
    {
      label: t("console.production.equipment.detail.tabs.rentals", undefined, "Rentals"),
      href: `/studio/production/equipment/${equipmentId}/rentals`,
    },
    {
      label: t("console.production.equipment.detail.tabs.qr", undefined, "QR"),
      href: `/studio/production/equipment/${equipmentId}/qr`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
