import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatCard } from '@/components/data/StatCard';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { AlertBanner } from '@/components/modules/AlertBanner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Inventory -- GVTEWAY' };

type InvItem = {
  name: string;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  unit: string;
  daily_rate: number | null;
  advance_subcategories: {
    name: string;
    advance_categories: {
      name: string;
      advance_category_groups: { name: string };
    };
  };
};

type InventoryRow = {
  id: string;
  quantity_owned: number;
  quantity_available: number;
  warehouse_location: string | null;
  updated_at: string;
  advance_items: InvItem | null;
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: inventory } = await supabase
    .from('catalog_item_inventory')
    .select(`*, advance_items (id, name, manufacturer, model, sku, unit, daily_rate, advance_subcategories (name, advance_categories (name, advance_category_groups (name))))`)
    .order('updated_at', { ascending: false });

  const items = (inventory ?? []) as InventoryRow[];
  const totalOwned = items.reduce((s, i) => s + i.quantity_owned, 0);
  const totalAvailable = items.reduce((s, i) => s + i.quantity_available, 0);
  const lowStockItems = items.filter((i) => i.quantity_available <= Math.ceil(i.quantity_owned * 0.1));

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (inv) => (
        <div>
          <div className="text-text-primary">{inv.advance_items?.name}</div>
          <div className="text-[0.5625rem] text-text-disabled">
            {inv.advance_items?.manufacturer} {inv.advance_items?.model}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (inv) => (
        <span className="text-text-tertiary">
          {inv.advance_items?.advance_subcategories?.advance_categories?.advance_category_groups?.name}
        </span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (inv) => (
        <span className="text-mono text-text-disabled">{inv.advance_items?.sku || '-'}</span>
      ),
    },
    {
      key: 'owned',
      header: 'Owned',
      align: 'right',
      render: (inv) => <span className="text-mono text-text-primary">{inv.quantity_owned}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      render: (inv) => {
        const isLow = inv.quantity_available <= Math.ceil(inv.quantity_owned * 0.1);
        return (
          <span className={`text-mono ${isLow ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
            {inv.quantity_available}
          </span>
        );
      },
    },
    {
      key: 'allocated',
      header: 'Allocated',
      align: 'right',
      render: (inv) => (
        <span className="text-mono text-cyan">{inv.quantity_owned - inv.quantity_available}</span>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilization',
      render: (inv) => {
        const u = inv.quantity_owned > 0
          ? Math.round(((inv.quantity_owned - inv.quantity_available) / inv.quantity_owned) * 100)
          : 0;
        return <ProgressBar value={u} width={64} showLabel />;
      },
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (inv) => <span className="text-text-tertiary">{inv.warehouse_location || '-'}</span>,
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (inv) => (
        <span className="text-mono text-text-tertiary">
          {inv.advance_items?.daily_rate ? `$${inv.advance_items.daily_rate}/d` : '-'}
        </span>
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        title="Inventory"
        subtitle={`${items.length} tracked items`}
      >
        <Button variant="ghost" size="sm">Import CSV</Button>
        <Button variant="ghost" size="sm">Export</Button>
      </ModuleHeader>
      <div className="page-content">
        <ContentGrid columns={{ sm: 2, md: 4 }} className="mb-8">
          <StatCard label="Total Owned" value={totalOwned} />
          <StatCard label="Available" value={totalAvailable} accent />
          <StatCard label="Allocated" value={totalOwned - totalAvailable} />
          <StatCard
            label="Low Stock"
            value={lowStockItems.length}
            accent={lowStockItems.length === 0}
          />
        </ContentGrid>

        {lowStockItems.length > 0 && (
          <AlertBanner variant="error" title="Low Stock Alerts">
            {lowStockItems.slice(0, 10).map((item) => (
              <Badge key={item.id} variant="error">
                {item.advance_items?.name} ({item.quantity_available}/{item.quantity_owned})
              </Badge>
            ))}
          </AlertBanner>
        )}

        <DataTable
          columns={columns}
          data={items}
          emptyText="No inventory data"
          rowClassName={(inv) =>
            inv.quantity_available <= Math.ceil(inv.quantity_owned * 0.1)
              ? 'bg-[rgba(239,68,68,0.04)]'
              : ''
          }
        />
      </div>
    </>
  );
}
