import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="crew" title="Call sheet" subtitle="Day-of info, load-in, parking, contacts">
      <EmptyState title="Awaiting call sheet" description="Production publishes the call sheet the day before each show. We'll text and email you the link." />
    </PortalSubpage>
  );
}
