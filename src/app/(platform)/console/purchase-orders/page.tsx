import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Purchase Orders -- GVTEWAY' };

type PORow = {
  id: string;
  po_number: string;
  status: string;
  total: number | null;
  expected_delivery: string | null;
  created_at: string;
  vendors: { id: string; name: string } | null;
  purchase_order_items: Array<{ quantity_ordered: number; quantity_received: number }> | null;
};

const PO_COLUMNS: DataTableColumn<PORow>[] = [
  {
    key: 'po_number',
    header: 'PO #',
    render: (po) => <span className="font-mono text-cyan text-[0.6875rem]">{po.po_number}</span>,
  },
  {
    key: 'vendor',
    header: 'Vendor',
    render: (po) => <span className="text-text-primary">{po.vendors?.name || '—'}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (po) => <StatusBadge status={po.status} />,
  },
  {
    key: 'items',
    header: 'Items',
    align: 'right',
    render: (po) => <span className="font-mono text-text-secondary">{po.purchase_order_items?.length || 0} lines</span>,
  },
  {
    key: 'received',
    header: 'Received',
    align: 'right',
    render: (po) => {
      const items = po.purchase_order_items || [];
      const totalOrdered = items.reduce((s, i) => s + i.quantity_ordered, 0);
      const totalReceived = items.reduce((s, i) => s + i.quantity_received, 0);
      const color = totalReceived >= totalOrdered ? '#22C55E' : totalReceived > 0 ? '#EAB308' : 'var(--color-text-disabled)';
      return (
        <span className="font-mono" style={{ color }}>{totalReceived}/{totalOrdered}</span>
      );
    },
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (po) => <span className="font-mono text-text-primary">${Number(po.total || 0).toLocaleString()}</span>,
  },
  {
    key: 'expected',
    header: 'Expected',
    render: (po) => <span className="text-text-tertiary">{po.expected_delivery || '—'}</span>,
  },
  {
    key: 'created',
    header: 'Created',
    render: (po) => <span className="text-text-disabled text-[0.625rem]">{new Date(po.created_at).toLocaleDateString()}</span>,
  },
];

export default async function PurchaseOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select(`*, vendors (id, name), purchase_order_items (id, quantity_ordered, quantity_received, unit_cost)`)
    .order('created_at', { ascending: false })
    .limit(100);

  const typedOrders = (orders ?? []) as PORow[];
  const statuses = ['draft', 'submitted', 'acknowledged', 'partially_received', 'received', 'closed', 'cancelled'];
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = typedOrders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = typedOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (Number(o.total) || 0), 0);

  return (
    <>
      <ModuleHeader
        title="Purchase Orders"
        subtitle={`${typedOrders.length} orders · $${totalValue.toLocaleString()} total value`}
      >
        <Button variant="primary" size="sm">New Purchase Order</Button>
      </ModuleHeader>

      <div className="page-content">
        {/* Status Rollup */}
        <div className="flex flex-wrap gap-2 mb-8">
          {statuses.filter(s => statusCounts[s] > 0).map(s => (
            <div key={s} className="card py-2 px-4 flex items-center gap-2">
              <span className="font-mono text-sm text-text-primary">{statusCounts[s]}</span>
              <span className="text-[0.5625rem] text-text-tertiary uppercase tracking-wider">{s.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        <DataTable
          columns={PO_COLUMNS}
          data={typedOrders}
          emptyText="No purchase orders"
          rowClassName={() => 'cursor-pointer'}
        />
      </div>
    </>
  );
}
