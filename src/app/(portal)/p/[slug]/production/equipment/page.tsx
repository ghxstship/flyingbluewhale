import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Equipment -- ${slug} -- GVTEWAY` }; 
}

type AllocationRow = {
  id: string;
  quantity: number;
  state: string;
  updated_at: string;
  advance_items: { name: string; manufacturer: string | null; model: string | null; unit: string } | null;
  spaces: { name: string } | null;
};

const ALLOCATION_COLUMNS: DataTableColumn<AllocationRow>[] = [
  {
    key: 'item',
    header: 'Item',
    render: (a) => (
      <div>
        <div className="text-text-primary text-sm">{a.advance_items?.name}</div>
        <div className="text-[0.5625rem] text-text-disabled uppercase tracking-wider">
          {a.advance_items?.manufacturer} {a.advance_items?.model}
        </div>
      </div>
    ),
  },
  {
    key: 'space',
    header: 'Space',
    render: (a) => <span className="text-text-tertiary">{a.spaces?.name || '-'}</span>,
  },
  {
    key: 'qty',
    header: 'Qty',
    render: (a) => <span className="font-mono text-text-primary">{a.quantity} {a.advance_items?.unit}</span>,
  },
  {
    key: 'state',
    header: 'State',
    render: (a) => <StatusBadge status={a.state} />,
  },
  {
    key: 'updated',
    header: 'Updated',
    render: (a) => <span className="text-text-tertiary text-xs">{new Date(a.updated_at).toLocaleDateString()}</span>,
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (a) => (
      <div className="flex justify-end gap-2">
        {a.state === 'reserved' && <Button variant="ghost" size="sm" className="text-cyan p-0">Confirm</Button>}
        {a.state === 'on_site' && <Button variant="ghost" size="sm" className="text-warning p-0">Checkout</Button>}
        {a.state === 'checked_out' && <Button variant="ghost" size="sm" className="text-success p-0">Return</Button>}
      </div>
    ),
  },
];

export default async function ProductionEquipmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: allocations } = await supabase
    .from('catalog_item_allocations')
    .select(`*, advance_items (name, manufacturer, model, unit), spaces (name)`)
    .order('created_at', { ascending: false })
    .limit(100);
    
  const states = ['reserved', 'confirmed', 'in_transit', 'on_site', 'checked_out', 'returned', 'maintenance'];
  const typedAllocations = (allocations ?? []) as AllocationRow[];

  return (
    <>
      <ModuleHeader
        title="Equipment"
        subtitle="Allocation tracking & fulfillment status"
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm" href={`/${slug}/production/vendor-submissions/equipment-pull-list`}>
          Add from Catalog
        </Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {states.map((s) => { 
            const count = typedAllocations.filter((a) => a.state === s).length; 
            return (
              <div key={s} className="card p-3 text-center flex flex-col justify-center">
                <div className="font-display text-xl text-text-primary leading-none mb-1">{count}</div>
                <div className={`text-[0.5rem] tracking-wider uppercase ${count > 0 ? 'text-cyan' : 'text-text-disabled'}`}>
                  {s.replace(/_/g, ' ')}
                </div>
              </div>
            ); 
          })}
        </div>

        {typedAllocations.length === 0 ? (
          <EmptyState 
            title="No equipment allocated yet" 
            actionLabel="Open Equipment Pull List"
            actionHref={`/${slug}/production/vendor-submissions/equipment-pull-list`}
          />
        ) : (
          <DataTable
            columns={ALLOCATION_COLUMNS}
            data={typedAllocations}
            emptyText="No equipment allocations"
          />
        )}
      </div>
    </>
  );
}
