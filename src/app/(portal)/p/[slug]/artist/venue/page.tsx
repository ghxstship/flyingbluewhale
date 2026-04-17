import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="artist" title="Venue" subtitle="Specs, load-in, parking">
      <EmptyState title="Venue specs" description="Production posts venue specs and load-in details here once confirmed." />
    </PortalSubpage>
  );
}
