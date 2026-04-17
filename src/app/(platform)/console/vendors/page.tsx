import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Vendors -- GVTEWAY' };

type VendorRow = {
  id: string;
  name: string;
  type: string;
  website: string | null;
  payment_terms: string | null;
  rating: number | null;
  vendor_contacts: Array<{ name: string; email: string | null; phone: string | null; is_primary: boolean }>;
};

const VENDOR_COLUMNS: DataTableColumn<VendorRow>[] = [
  {
    key: 'vendor',
    header: 'Vendor',
    render: (v) => (
      <div>
        <div className="text-text-primary font-medium">{v.name}</div>
        {v.website && <div className="text-[0.5625rem] text-cyan">{v.website}</div>}
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (v) => <StatusBadge status={v.type} />,
  },
  {
    key: 'payment_terms',
    header: 'Payment Terms',
    render: (v) => (
      <span className="text-mono text-text-tertiary text-[0.625rem]">
        {v.payment_terms?.replace(/_/g, ' ') || '—'}
      </span>
    ),
  },
  {
    key: 'contact',
    header: 'Contact',
    render: (v) => {
      const primary = v.vendor_contacts?.find(c => c.is_primary) || v.vendor_contacts?.[0];
      if (!primary) return <span className="text-text-disabled">—</span>;
      return (
        <div>
          <div className="text-text-secondary text-[0.6875rem]">{primary.name}</div>
          {primary.email && <div className="text-[0.5625rem] text-text-disabled">{primary.email}</div>}
        </div>
      );
    },
  },
  {
    key: 'rating',
    header: 'Rating',
    render: (v) => {
      if (v.rating == null) return <span className="text-text-disabled">—</span>;
      const stars = '★'.repeat(Math.round(v.rating)) + '☆'.repeat(5 - Math.round(v.rating));
      return (
        <span className={`text-[0.625rem] ${v.rating >= 4 ? 'text-[#EAB308]' : 'text-text-disabled'}`}>
          {stars}
        </span>
      );
    },
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <button className="text-cyan text-[0.625rem] bg-transparent border-none cursor-pointer hover:text-cyan-bright transition-colors">
        Edit
      </button>
    ),
  },
];

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from('vendors')
    .select(`*, vendor_contacts (*)`)
    .eq('is_active', true)
    .order('name');

  return (
    <>
      <ModuleHeader
        title="Vendors"
        subtitle={`${vendors?.length ?? 0} vendors · Suppliers, carriers, rental houses`}
      >
        <Button variant="primary" size="sm">New Vendor</Button>
      </ModuleHeader>
      <div className="page-content">
        <DataTable
          columns={VENDOR_COLUMNS}
          data={(vendors ?? []) as VendorRow[]}
          emptyText="No vendors registered"
        />
      </div>
    </>
  );
}
