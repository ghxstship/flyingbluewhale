import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PortalSubpage slug={slug} persona="vendor" title="Invoices" subtitle="Submit invoices and track payment status">
      <EmptyState title="Submit an invoice" description="Upload your invoice PDF here; payouts go via Stripe Connect once approved." />
    </PortalSubpage>
  );
}
