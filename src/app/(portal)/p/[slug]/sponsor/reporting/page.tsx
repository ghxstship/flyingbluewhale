import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="sponsor" title="Reporting" subtitle="Impressions, engagement, post-show recap">
      <EmptyState title="Recap pending" description="We publish the impression and engagement report here within 7 days post-show." />
    </PortalSubpage>
  );
}
