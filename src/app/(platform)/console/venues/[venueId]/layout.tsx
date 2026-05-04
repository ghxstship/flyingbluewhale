import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

/**
 * Venue detail layout — record-tabs across the eight existing venue
 * sub-routes (build, certifications, closeout, design, handover, run
 * of show, vop, zones). Tabs render inside each page's ModuleHeader
 * via context.
 */
export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const tabs = [
    { label: "Overview", href: `/console/venues/${venueId}` },
    { label: "Design", href: `/console/venues/${venueId}/design` },
    { label: "Build", href: `/console/venues/${venueId}/build` },
    { label: "Zones", href: `/console/venues/${venueId}/zones` },
    { label: "Certifications", href: `/console/venues/${venueId}/certifications` },
    { label: "Run of Show", href: `/console/venues/${venueId}/ros` },
    { label: "VOP", href: `/console/venues/${venueId}/vop` },
    { label: "Handover", href: `/console/venues/${venueId}/handover` },
    { label: "Closeout", href: `/console/venues/${venueId}/closeout` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
