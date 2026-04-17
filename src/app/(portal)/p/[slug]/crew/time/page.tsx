import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="crew" title="Time" subtitle="Submit hours worked and break times">
      <EmptyState
        title="Clock in from the mobile app"
        description="Use the field PWA for geo-verified clock in/out. Total hours appear here for your review."
        action={<Button href="/m/crew/clock">Open mobile clock →</Button>}
      />
    </PortalSubpage>
  );
}
