import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { KanbanBoard, type KanbanColumn } from '@/components/modules/KanbanBoard';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Fulfillment -- GVTEWAY' };

type FulfillmentOrder = {
  id: string;
  reference_number: string | null;
  type: string;
  status: string;
  destination: string | null;
  total_items: number;
  created_at: string;
};

const COLUMN_DEFS = [
  { key: 'pending', label: 'Pending', color: '#9CA3AF' },
  { key: 'packing', label: 'Packing', color: '#3B82F6' },
  { key: 'packed', label: 'Packed', color: '#A855F7' },
  { key: 'in_transit', label: 'In Transit', color: '#6366F1' },
  { key: 'delivered', label: 'Delivered', color: '#22C55E' },
  { key: 'completed', label: 'Completed', color: '#00E5FF' },
];

export default async function FulfillmentPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('fulfillment_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const typedOrders = (orders ?? []) as FulfillmentOrder[];

  const columns: KanbanColumn<FulfillmentOrder>[] = COLUMN_DEFS.map((def) => ({
    ...def,
    items: typedOrders.filter((o) => o.status === def.key),
  }));

  return (
    <>
      <ModuleHeader
        title="Fulfillment"
        subtitle={`${typedOrders.length} orders · Pick → Pack → Ship → Deliver`}
      >
        <Button variant="primary" size="sm">New Fulfillment Order</Button>
      </ModuleHeader>
      <div className="p-8">
        <KanbanBoard
          columns={columns}
          itemKey={(order) => order.id}
          renderCard={(order) => (
            <div className="card p-3 cursor-pointer">
              <div className="flex justify-between mb-2">
                <span className="text-mono text-[0.625rem] text-cyan">
                  {order.reference_number || order.id.slice(0, 8)}
                </span>
                <StatusBadge status={order.type} />
              </div>
              {order.destination && (
                <p className="text-xs text-text-secondary mb-2 truncate">
                  {order.destination}
                </p>
              )}
              <div className="flex justify-between text-[0.5625rem] text-text-disabled">
                <span>{order.total_items} items</span>
              </div>
            </div>
          )}
        />
      </div>
    </>
  );
}
