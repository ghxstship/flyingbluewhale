import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="artist" title="Travel" subtitle="Flights, hotel, ground transport">
      <EmptyState title="Travel itinerary" description="Itineraries post here once ground and lodging are confirmed." />
    </PortalSubpage>
  );
}
