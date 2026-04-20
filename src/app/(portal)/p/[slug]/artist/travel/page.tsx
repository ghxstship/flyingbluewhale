import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="artist" title="Travel" subtitle="Flights, ground, hotel">
      <EmptyState
        title="Travel details arrive close to show day"
        description="Production desks post the flight, ground, and hotel handoff here about a week before you travel. You'll also get a confirmation email."
      />
    </PortalSubpage>
  );
}
