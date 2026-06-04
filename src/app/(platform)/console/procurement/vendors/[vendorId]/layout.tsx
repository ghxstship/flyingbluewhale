import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Vendor detail layout — absorbs the Scorecards primary-nav leaf
 * removed in the WAYFINDER remediation into a per-vendor tab. POs and
 * Submittals filter their respective lists by vendor_id.
 */
export default async function VendorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = await params;
  const { t } = await getRequestT();
  const tabs = [
    {
      label: t("console.procurement.vendors.tabs.overview", undefined, "Overview"),
      href: `/console/procurement/vendors/${vendorId}`,
    },
    {
      label: t("console.procurement.vendors.tabs.pos", undefined, "POs"),
      href: `/console/procurement/vendors/${vendorId}/pos`,
    },
    {
      label: t("console.procurement.vendors.tabs.submittals", undefined, "Submittals"),
      href: `/console/procurement/vendors/${vendorId}/submittals`,
    },
    {
      label: t("console.procurement.vendors.tabs.prequalification", undefined, "Prequalification"),
      href: `/console/procurement/vendors/${vendorId}/prequalification`,
    },
    {
      label: t("console.procurement.vendors.tabs.scorecard", undefined, "Scorecard"),
      href: `/console/procurement/vendors/${vendorId}/scorecard`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
