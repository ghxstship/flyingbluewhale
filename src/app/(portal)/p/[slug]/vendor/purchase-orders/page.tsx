import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Purchase orders" subtitle="POs issued to your account">
      <EmptyState title="No POs yet" description="Production will issue purchase orders here. You'll get an email when one drops." />
    </PortalSubpage>
  );
}
