import { ModuleHeader } from '@/components/layout/ModuleHeader';
import PipelineViewSwitcher from '@/components/console/pipeline/PipelineViewSwitcher';

export default async function PipelinePage() {
  // Placeholder deal data since SQL schema is pending migration.
  const deals = [
    {
      id: '1',
      title: 'Polymarket Vendor Grid',
      client_name: 'Polymarket',
      deal_value: 45000,
      stage: 'Negotiation',
      probability: 80,
      expected_close_date: '2026-05-01',
      owner_name: 'Julian',
    },
    {
      id: '2',
      title: 'Factory Town Activation Q3',
      client_name: 'Factory Town',
      deal_value: 120000,
      stage: 'Proposal Sent',
      probability: 40,
      expected_close_date: '2026-06-15',
      owner_name: 'Sarah',
    }
  ] as any;

  return (
    <>
      <ModuleHeader
        title="Sales Pipeline"
        subtitle="Manage leads, track CRM velocity, and close proposals."
      />
      <div className="p-6 h-[calc(100vh-140px)]">
        <PipelineViewSwitcher deals={deals} />
      </div>
    </>
  );
}
