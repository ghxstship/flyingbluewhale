import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  const tabs = [
    { label: t("console.venues.tabs.overview", undefined, "Overview"), href: `/studio/venues/${venueId}` },
    { label: t("console.venues.tabs.design", undefined, "Design"), href: `/studio/venues/${venueId}/design` },
    { label: t("console.venues.tabs.build", undefined, "Build"), href: `/studio/venues/${venueId}/build` },
    { label: t("console.venues.tabs.zones", undefined, "Zones"), href: `/studio/venues/${venueId}/zones` },
    {
      label: t("console.venues.tabs.certifications", undefined, "Certifications"),
      href: `/studio/venues/${venueId}/certifications`,
    },
    { label: t("console.venues.tabs.ros", undefined, "Run of Show"), href: `/studio/venues/${venueId}/ros` },
    { label: t("console.venues.tabs.vop", undefined, "VOP"), href: `/studio/venues/${venueId}/vop` },
    { label: t("console.venues.tabs.handover", undefined, "Handover"), href: `/studio/venues/${venueId}/handover` },
    { label: t("console.venues.tabs.closeout", undefined, "Closeout"), href: `/studio/venues/${venueId}/closeout` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
