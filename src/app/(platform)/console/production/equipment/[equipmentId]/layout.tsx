import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

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
  const tabs = [
    { label: "Overview", href: `/console/production/equipment/${equipmentId}` },
    { label: "Maintenance", href: `/console/production/equipment/${equipmentId}/maintenance` },
    { label: "Rentals", href: `/console/production/equipment/${equipmentId}/rentals` },
    { label: "QR", href: `/console/production/equipment/${equipmentId}/qr` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
