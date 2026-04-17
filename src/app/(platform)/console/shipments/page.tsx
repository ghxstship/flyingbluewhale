import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { AlertBanner } from '@/components/modules/AlertBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Shipments -- GVTEWAY' };

type ShipmentRow = {
  id: string;
  reference_number: string;
  direction: string;
  status: string;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  bol_number: string | null;
  scheduled_delivery_at: string | null;
  piece_count: number | null;
  vendors: { id: string; name: string } | null;
};

const SHIPMENT_COLUMNS: DataTableColumn<ShipmentRow>[] = [
  {
    key: 'ref',
    header: 'Ref #',
    render: (s) => <span className="font-mono text-cyan text-[0.6875rem]">{s.reference_number}</span>,
  },
  {
    key: 'direction',
    header: 'Direction',
    render: (s) => <StatusBadge status={s.direction} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: 'carrier',
    header: 'Carrier',
    render: (s) => <span className="text-text-secondary">{s.vendors?.name || s.carrier_name || '—'}</span>,
  },
  {
    key: 'tracking',
    header: 'Tracking',
    render: (s) => {
      if (!s.tracking_number) return <span className="text-text-disabled">—</span>;
      return (
        <span 
          className={`font-mono text-[0.625rem] ${s.tracking_url ? 'text-cyan underline' : 'text-text-secondary'}`}
        >
          {s.tracking_number}
        </span>
      );
    },
  },
  {
    key: 'bol',
    header: 'BOL',
    render: (s) => <span className={`font-mono text-[0.625rem] ${s.bol_number ? 'text-text-secondary' : 'text-text-disabled'}`}>{s.bol_number || '—'}</span>,
  },
  {
    key: 'scheduled',
    header: 'Scheduled',
    render: (s) => <span className="text-text-tertiary text-[0.625rem]">{s.scheduled_delivery_at ? new Date(s.scheduled_delivery_at).toLocaleDateString() : '—'}</span>,
  },
  {
    key: 'pieces',
    header: 'Pieces',
    render: (s) => <span className="font-mono text-text-secondary">{s.piece_count || '—'}</span>,
  },
];

export default async function ShipmentsPage() {
  const supabase = await createClient();
  const { data: shipments } = await supabase
    .from('shipments')
    .select(`*, vendors!carrier_id (id, name)`)
    .order('created_at', { ascending: false })
    .limit(100);

  const typedShipments = (shipments ?? []) as ShipmentRow[];
  const activeShipments = typedShipments.filter(s => !['delivered','cancelled'].includes(s.status));
  const inTransit = typedShipments.filter(s => s.status === 'in_transit').length;
  const exceptions = typedShipments.filter(s => s.status === 'exception');

  return (
    <>
      <ModuleHeader
        title="Shipments"
        subtitle={`${activeShipments.length} active · ${inTransit} in transit${exceptions.length > 0 ? ` · ${exceptions.length} exceptions` : ''}`}
      >
        <Button variant="secondary" size="sm">Upload BOL</Button>
        <Button variant="primary" size="sm">New Shipment</Button>
      </ModuleHeader>

      <div className="page-content">
        {exceptions.length > 0 && (
          <AlertBanner variant="error" title="⚠ Shipment Exceptions">
            {exceptions.map(s => (
              <Badge key={s.id} variant="error">
                {s.reference_number} · {s.tracking_number || 'no tracking'}
              </Badge>
            ))}
          </AlertBanner>
        )}

        <DataTable
          columns={SHIPMENT_COLUMNS}
          data={typedShipments}
          emptyText="No shipments"
          rowClassName={() => 'cursor-pointer'}
        />
      </div>
    </>
  );
}
