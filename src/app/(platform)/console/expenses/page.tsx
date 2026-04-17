import { ModuleHeader } from '@/components/layout/ModuleHeader';
import ExpensesTable from '@/components/console/expenses/ExpensesTable';

export default async function ExpensesPage() {
  const mockExpenses = [
    {
      id: '1',
      date: '2026-04-12',
      amount: 1200.50,
      category: 'Travel',
      vendor_name: 'Delta Airlines',
      approval_status: 'approved',
      reimbursement_status: 'paid'
    }
  ] as any;

  return (
    <>
      <ModuleHeader 
        title="Expense Hub" 
        subtitle="Manage and approve team reimbursements and corporate spend." 
      />
      <div className="p-6 h-[calc(100vh-140px)]">
        <ExpensesTable expenses={mockExpenses} />
      </div>
    </>
  );
}
