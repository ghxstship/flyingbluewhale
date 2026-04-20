import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="guest" title="Logistics" subtitle="Parking, gates, ADA, weather">
      <EmptyState
        title="Logistics publish day-of"
        description="Parking gates, ADA access points, and weather notes post here the morning of the show. Your ticket + event guide will still have the entry details."
      />
    </PortalSubpage>
  );
}
