import { RouteTabs } from "@/components/ui/RouteTabs";

/**
 * Venue detail layout — persistent record-tabs strip across the eight
 * existing venue sub-routes (build, certifications, closeout, design,
 * handover, run of show, vop, zones). Mirrors the project layout
 * pattern shipped in Phase B of the WAYFINDER remediation.
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
  return (
    <>
      <div className="sticky top-14 z-20 border-b border-[var(--border-color)] bg-[var(--background)]/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/65">
        <RouteTabs tabs={tabs} />
      </div>
      {children}
    </>
  );
}
