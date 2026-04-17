import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { AlertBanner } from '@/components/modules/AlertBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Asset Registry -- GVTEWAY' };

type AssetRow = {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  status: string;
  condition: string;
  barcode: string | null;
  advance_items: { name: string; manufacturer: string | null; model: string | null; sku: string | null } | null;
  locations: { name: string; type: string } | null;
};

const CONDITION_COLORS: Record<string, string> = {
  new: '#00E5FF',
  good: '#22C55E',
  fair: '#EAB308',
  damaged: '#F97316',
  defective: '#EF4444',
};

const ASSET_COLUMNS: DataTableColumn<AssetRow>[] = [
  {
    key: 'asset_tag',
    header: 'Asset Tag',
    render: (a) => (
      <span className="text-mono text-cyan text-[0.6875rem] font-semibold">{a.asset_tag}</span>
    ),
  },
  {
    key: 'item',
    header: 'Item',
    render: (a) => (
      <div>
        <div className="text-text-primary">{a.advance_items?.name}</div>
        <div className="text-[0.5625rem] text-text-disabled">
          {a.advance_items?.manufacturer} {a.advance_items?.model}
        </div>
      </div>
    ),
  },
  {
    key: 'serial',
    header: 'Serial #',
    render: (a) => (
      <span className={`text-mono text-[0.625rem] ${a.serial_number ? 'text-text-secondary' : 'text-text-disabled'}`}>
        {a.serial_number || '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (a) => <StatusBadge status={a.status} />,
  },
  {
    key: 'condition',
    header: 'Condition',
    render: (a) => {
      const color = CONDITION_COLORS[a.condition] || '#9CA3AF';
      return (
        <span className="text-[0.5625rem] tracking-wider" style={{ color }}>
          {a.condition}
        </span>
      );
    },
  },
  {
    key: 'location',
    header: 'Location',
    render: (a) => (
      <span className="text-text-tertiary text-[0.6875rem]">{a.locations?.name || '—'}</span>
    ),
  },
  {
    key: 'barcode',
    header: 'Barcode',
    render: (a) => (
      <span className="text-mono text-[0.5625rem] text-text-disabled">{a.barcode || '—'}</span>
    ),
  },
];

export default async function AssetsPage() {
  const supabase = await createClient();
  const { data: assets } = await supabase
    .from('asset_instances')
    .select(`*, advance_items (id, name, manufacturer, model, sku), locations (id, name, type)`)
    .order('created_at', { ascending: false })
    .limit(200);

  const typedAssets = (assets ?? []) as AssetRow[];
  const totalAssets = typedAssets.length;
  
  const statuses = ['available', 'allocated', 'checked_out', 'in_transit', 'maintenance', 'lost', 'retired'];
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = typedAssets.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const lostAssets = typedAssets.filter(a => a.status === 'lost');

  return (
    <>
      <ModuleHeader
        title="Asset Registry"
        subtitle={`${totalAssets} registered assets · Per-unit serial tracking`}
      >
        <Button variant="secondary" size="sm">Scan Barcode</Button>
        <Button variant="primary" size="sm">Register Asset</Button>
      </ModuleHeader>
      
      <div className="page-content">
        <ContentGrid columns={{ sm: 2, md: 4, lg: 7 }} gap="0.5rem" className="mb-8">
          {statuses.map(s => {
            const count = statusCounts[s];
            return (
              <div key={s} className="card p-3 text-center">
                <div className={`font-display text-xl ${count > 0 ? 'text-text-primary' : 'text-text-disabled'}`}>
                  {count}
                </div>
                <div className={`text-[0.5rem] tracking-wider uppercase ${count > 0 ? 'text-text-secondary' : 'text-text-disabled'}`}>
                  {s.replace(/_/g, ' ')}
                </div>
              </div>
            );
          })}
        </ContentGrid>

        {lostAssets.length > 0 && (
          <AlertBanner variant="error" title="Lost Assets">
            {lostAssets.map(a => (
              <Badge key={a.id} variant="error">
                {a.asset_tag} · {a.advance_items?.name}
              </Badge>
            ))}
          </AlertBanner>
        )}

        <DataTable
          columns={ASSET_COLUMNS}
          data={typedAssets}
          emptyText="No assets registered"
          rowClassName={() => 'cursor-pointer'}
        />
      </div>
    </>
  );
}
