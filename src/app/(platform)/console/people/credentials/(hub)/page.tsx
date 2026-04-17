import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { StatCard } from '@/components/data/StatCard';
import { SectionHeading } from '@/components/data/SectionHeading';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Credentials -- GVTEWAY' };

type OrderRow = {
  id: string;
  group_name: string | null;
  user_id: string | null;
  quantity: number;
  status: string;
  created_at: string;
  credential_types: { name: string; color: string } | null;
};

const ORDER_COLUMNS: DataTableColumn<OrderRow>[] = [
  {
    key: 'select',
    header: '',
    render: () => <input type="checkbox" className="accent-cyan" />,
  },
  {
    key: 'type',
    header: 'Type',
    render: (o) => (
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ background: o.credential_types?.color || '#00E5FF' }} 
        />
        <span className="text-text-primary">{o.credential_types?.name || '?'}</span>
      </div>
    ),
  },
  {
    key: 'group_person',
    header: 'Group / Person',
    render: (o) => (
      <span className="text-text-secondary">
        {o.group_name || o.user_id?.slice(0, 8) || '-'}
      </span>
    ),
  },
  {
    key: 'qty',
    header: 'Qty',
    render: (o) => <span className="text-mono text-text-primary">{o.quantity}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (o) => <StatusBadge status={o.status} />,
  },
  {
    key: 'requested',
    header: 'Requested',
    render: (o) => (
      <span className="text-text-tertiary">
        {new Date(o.created_at).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: (o) => {
      if (o.status !== 'requested') return null;
      return (
        <div className="flex gap-1">
          <button className="bg-transparent border-none text-[#22C55E] cursor-pointer text-xs hover:text-green-400">✓</button>
          <button className="bg-transparent border-none text-[#EF4444] cursor-pointer text-xs hover:text-red-400">✕</button>
        </div>
      );
    },
  },
];

export default async function CredentialManagerPage() {
  const supabase = await createClient();
  const { count: typesCount } = await supabase.from('credential_types').select('*', { count: 'exact', head: true });
  const { count: zonesCount } = await supabase.from('credential_zones').select('*', { count: 'exact', head: true });
  const { count: ordersCount } = await supabase.from('credential_orders').select('*', { count: 'exact', head: true });
  
  const { data: orders } = await supabase
    .from('credential_orders')
    .select(`*, credential_types (name, color)`)
    .order('created_at', { ascending: false })
    .limit(50);

  const typedOrders = (orders ?? []) as OrderRow[];
  const pendingOrders = typedOrders.filter((o) => o.status === 'requested');
  
  const credTypes = ['Executive', 'Production', 'Management', 'Crew', 'Staff', 'Talent', 'VIP', 'Vendor', 'Sponsor', 'Press', 'Guest', 'Attendee'];
  const zones = ['Backstage', 'FOH', 'BOH', 'VIP Lounge', 'Media Pit', 'All Access'];
  const matrixDefaults: Record<string, string[]> = { 
    Artist: ['Backstage', 'FOH', 'VIP Lounge'], 
    Crew: ['Backstage', 'BOH'], 
    Staff: ['Backstage', 'FOH', 'BOH', 'VIP Lounge', 'All Access'], 
    VIP: ['FOH', 'VIP Lounge'], 
    Media: ['FOH', 'Media Pit'] 
  };

  return (
    <>
      <ModuleHeader
        title="Credential Manager"
        subtitle={`${typesCount ?? 0} types · ${zonesCount ?? 0} zones · ${ordersCount ?? 0} orders`}
      />
      
      <div className="page-content">
        {/* Stats */}
        <ContentGrid columns={{ sm: 2, lg: 4 }} className="mb-10">
          <StatCard label="Credential Types" value={typesCount ?? 0} accent />
          <StatCard label="Zones Defined" value={zonesCount ?? 0} accent />
          <StatCard label="Pending Approval" value={pendingOrders.length} accent />
          <StatCard label="Total Orders" value={ordersCount ?? 0} accent />
        </ContentGrid>
        
        {/* Types */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading className="!mb-0">Credential Types</SectionHeading>
            <Button variant="primary" size="sm">Add Type</Button>
          </div>
          
          <ContentGrid columns={{ sm: 2, md: 3, lg: 4 }} gap="0.75rem">
            {credTypes.map((t) => (
              <div key={t} className="card p-3 cursor-pointer hover:border-cyan transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
                  <span className="text-[0.8125rem] text-text-primary group-hover:text-cyan transition-colors">{t}</span>
                </div>
                <span className="text-mono text-[0.5625rem] text-text-disabled">0 issued</span>
              </div>
            ))}
          </ContentGrid>
        </section>
        
        {/* Zone Matrix */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading className="!mb-0">Zone Access Matrix</SectionHeading>
            <Button variant="secondary" size="sm">Add Zone</Button>
          </div>
          
          <div className="card overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type / Zone</th>
                  {zones.map((z) => (
                    <th key={z} className="!text-center !px-2">{z}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {credTypes.slice(0, 6).map((t) => (
                  <tr key={t}>
                    <td className="text-text-primary font-medium">{t}</td>
                    {zones.map((z) => (
                      <td key={z} className="!text-center">
                        <input 
                          type="checkbox" 
                          defaultChecked={(matrixDefaults[t] || []).includes(z)} 
                          className="accent-cyan w-3 h-3" 
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
        {/* Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading className="!mb-0">Credential Orders</SectionHeading>
            <div className="flex gap-2">
              <Button variant="primary" size="sm">Bulk Approve</Button>
              <Button variant="secondary" size="sm">Generate Badges</Button>
            </div>
          </div>
          
          <DataTable
            columns={ORDER_COLUMNS}
            data={typedOrders}
            emptyText="No credential orders yet"
          />
        </section>
      </div>
    </>
  );
}
