import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CampaignsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="Campaigns" subtitle="Outbound sequences and marketing blasts" />
      <div className="page-content">
        <EmptyState
          title="Campaign builder coming soon"
          description="Drip campaigns, event follow-ups, and annual renewals. Integrate with your Stripe-backed client list."
        />
      </div>
    </>
  );
}
