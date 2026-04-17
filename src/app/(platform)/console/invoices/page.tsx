import { ModuleHeader } from '@/components/layout/ModuleHeader';
import InvoiceTabs from '@/components/console/invoices/InvoiceTabs';

export default async function InvoicesPage() {
  const mockInvoices = [
    {
      id: '1',
      invoice_number: 'INV-2026-001',
      status: 'sent',
      issue_date: '2026-04-15',
      due_date: '2026-05-15',
      total_amount: 45000,
      balance_due: 45000,
      client_name: 'Polymarket'
    }
  ] as any;

  return (
    <>
      <ModuleHeader 
        title="Invoices & A/R" 
        subtitle="Track incoming cash flow, generate invoices, and log payments." 
      />
      <div className="p-6 h-[calc(100vh-140px)]">
        <InvoiceTabs invoices={mockInvoices} />
      </div>
    </>
  );
}
