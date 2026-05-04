import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

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
  const tabs = [
    { label: "Overview", href: `/console/procurement/vendors/${vendorId}` },
    { label: "POs", href: `/console/procurement/vendors/${vendorId}/pos` },
    { label: "Submittals", href: `/console/procurement/vendors/${vendorId}/submittals` },
    { label: "Prequalification", href: `/console/procurement/vendors/${vendorId}/prequalification` },
    { label: "Scorecard", href: `/console/procurement/vendors/${vendorId}/scorecard` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
