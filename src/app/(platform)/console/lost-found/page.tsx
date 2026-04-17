import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { StatCard } from '@/components/data/StatCard';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Lost & Found -- GVTEWAY' };

export default async function LostFoundPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('lost_found_reports')
    .select(`*, asset_instances (id, asset_tag, advance_items (id, name))`)
    .order('created_at', { ascending: false })
    .limit(100);

  const categoryIcons: Record<string, string> = {
    radio: '📻', credential: '🎫', equipment: '🔧', personal_item: '👝', 
    clothing: '👕', electronics: '📱', wallet_keys: '🔑', other: '📦',
  };

  const openReports = (reports ?? []).filter(r => !['returned','shipped','disposed'].includes(r.status));
  const resolved = (reports ?? []).filter(r => ['returned','shipped'].includes(r.status)).length;
  const unclaimed = (reports ?? []).filter(r => r.status === 'unclaimed').length;

  return (
    <>
      <ModuleHeader
        title="Lost &amp; Found"
        subtitle={`${openReports.length} open · ${resolved} resolved${unclaimed > 0 ? ` · ${unclaimed} unclaimed` : ''}`}
      >
        <Button variant="secondary" size="sm">Report Lost</Button>
        <Button variant="primary" size="sm">Report Found</Button>
      </ModuleHeader>

      <div className="page-content">
        <ContentGrid columns={{ sm: 2, md: 4 }} className="mb-8">
          <StatCard label="Open Reports" value={openReports.length} accent />
          <StatCard label="Claimed" value={(reports ?? []).filter(r => r.status === 'claimed').length} />
          <StatCard label="Resolved" value={resolved} />
          <StatCard label="Unclaimed" value={unclaimed} accent={unclaimed === 0} />
        </ContentGrid>
        
        {(reports?.length ?? 0) === 0 ? (
          <EmptyState 
            title="No lost &amp; found reports" 
          />
        ) : (
          <div className="flex flex-col gap-2">
            {reports?.map((r) => {
              const icon = categoryIcons[r.category] || '📦';
              const asset = r.asset_instances as { asset_tag: string; advance_items: { name: string } | null } | null;
              const isLost = r.type === 'lost';
              
              return (
                <div 
                  key={r.id} 
                  className="card p-4 flex items-center gap-4 cursor-pointer hover:border-cyan transition-colors" 
                  style={{ borderLeft: `3px solid ${isLost ? '#EF4444' : '#22C55E'}` }}
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[0.5625rem] text-cyan">{r.reference_number}</span>
                      <span className={`badge text-[0.5rem] tracking-wider uppercase ${isLost ? 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]' : 'bg-[rgba(34,197,94,0.12)] text-[#22C55E]'}`}>
                        {r.type}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-text-primary text-[0.8125rem] truncate">{r.item_description}</div>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      {r.found_location_id && (
                        <span className="text-[0.5625rem] text-text-disabled">📍 Location ID: {r.found_location_id}</span>
                      )}
                      {asset && (
                        <span className="text-[0.5625rem] text-cyan">🏷 {asset.asset_tag}</span>
                      )}
                      {r.claimed_by_name && (
                        <span className="text-[0.5625rem] text-text-tertiary">👤 {r.claimed_by_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[0.5625rem] text-text-disabled">
                      {r.found_at ? new Date(r.found_at).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[0.5rem] text-text-disabled mt-0.5 capitalize">
                      {r.category.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
