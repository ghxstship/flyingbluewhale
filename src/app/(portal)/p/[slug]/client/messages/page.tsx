import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="client" title="Messages" subtitle="Direct thread with your production team">
      <EmptyState title="No messages yet" description="Production will post status updates and questions here." />
    </PortalSubpage>
  );
}
