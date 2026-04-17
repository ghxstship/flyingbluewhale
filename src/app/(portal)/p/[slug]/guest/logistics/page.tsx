import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="guest" title="Logistics" subtitle="Parking, entrances, rideshare">
      <EmptyState title="Day-of logistics" description="Map, entrance, and rideshare drop-off info posts here 72 hours before the event." />
    </PortalSubpage>
  );
}
