import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { StatCard } from '@/components/data/StatCard';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Receiving -- ${slug} -- GVTEWAY` }; 
}

type ReceivingRow = {
  id: string;
  reference_number: string;
  status: string;
  source: string;
  created_at: string;
  locations: { name: string } | null;
  vendors: { name: string } | null;
  purchase_orders: { po_number: string } | null;
  receiving_record_items: Array<{ quantity_expected: number; quantity_received: number; quantity_damaged: number }> | null;
};

const RECEIVING_COLUMNS: DataTableColumn<ReceivingRow>[] = [
  {
    key: 'ref',
    header: 'Ref #',
    render: (r) => <span className="font-mono text-[0.6875rem] text-cyan">{r.reference_number}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: 'source',
    header: 'Source',
    render: (r) => <span className="badge text-[0.5rem] tracking-wider uppercase bg-surface-raised text-text-tertiary border border-border">{r.source.replace(/_/g, ' ')}</span>,
  },
  {
    key: 'po_vendor',
    header: 'PO / Vendor',
    render: (r) => (
      <div>
        {r.purchase_orders && <span className="text-text-secondary mr-2">PO: <span className="font-mono text-cyan">{r.purchase_orders.po_number}</span></span>}
        {r.vendors && <span className="text-text-tertiary text-xs">{r.vendors.name}</span>}
      </div>
    ),
  },
  {
    key: 'location',
    header: 'Location',
    render: (r) => <span className="text-text-tertiary text-xs">{r.locations?.name ? `📍 ${r.locations.name}` : '-'}</span>,
  },
  {
    key: 'items',
    header: 'Items',
    render: (r) => {
      const items = r.receiving_record_items || [];
      const totalExpected = items.reduce((s, i) => s + i.quantity_expected, 0);
      const totalReceived = items.reduce((s, i) => s + i.quantity_received, 0);
      const totalDamaged = items.reduce((s, i) => s + i.quantity_damaged, 0);
      
      return (
        <div className="flex flex-col gap-1">
          <span className={`font-mono text-xs ${totalReceived >= totalExpected ? 'text-success' : totalReceived > 0 ? 'text-warning' : 'text-text-disabled'}`}>
            {totalReceived}/{totalExpected} received
          </span>
          {totalDamaged > 0 && <span className="font-mono text-xs text-error">{totalDamaged} damaged</span>}
        </div>
      );
    },
  },
  {
    key: 'date',
    header: 'Date',
    align: 'right',
    render: (r) => <span className="text-[0.5625rem] text-text-disabled">{new Date(r.created_at).toLocaleDateString()}</span>,
  },
];

export default async function ReceivingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: records } = await supabase
    .from('receiving_records')
    .select(`*, locations (id, name), vendors (id, name), purchase_orders (id, po_number), receiving_record_items (id, description, quantity_expected, quantity_received, quantity_damaged, condition)`)
    .order('created_at', { ascending: false })
    .limit(50);
    
  const typedRecords = (records ?? []) as ReceivingRow[];
  const states = ['scheduled', 'in_progress', 'completed', 'disputed'];

  return (
    <>
      <ModuleHeader
        title="Receiving"
        subtitle="Receive inbound deliveries & verify against purchase orders"
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">New Receipt</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {states.map(s => {
            const count = typedRecords.filter(r => r.status === s).length;
            return <StatCard key={s} label={s.replace(/_/g, ' ')} value={count} accent={count > 0} />;
          })}
        </div>
        
        {typedRecords.length === 0 ? (
          <EmptyState title="No receiving records" actionLabel="Create First Receipt" actionHref="#" />
        ) : (
          <DataTable
            columns={RECEIVING_COLUMNS}
            data={typedRecords}
            emptyText="No receiving records"
            rowClassName={() => 'cursor-pointer hover:border-cyan transition-colors'}
          />
        )}
      </div>
    </>
  );
}
