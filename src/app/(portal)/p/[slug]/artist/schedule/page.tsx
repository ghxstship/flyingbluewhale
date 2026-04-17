import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="artist" title="Show schedule" subtitle="Set times, load-in, sound-check">
      <EmptyState title="Day-of schedule" description="Schedule posts as soon as production confirms your set times." />
    </PortalSubpage>
  );
}
