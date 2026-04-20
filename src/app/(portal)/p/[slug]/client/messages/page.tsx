import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="client" title="Messages" subtitle="Production-to-client updates">
      <EmptyState
        title="Messages appear by email + here"
        description="Your production desk sends project updates to the email on file; a copy lands here so you can scan the thread without searching your inbox. No inbound from this surface — reach your production lead directly for anything urgent."
      />
    </PortalSubpage>
  );
}
