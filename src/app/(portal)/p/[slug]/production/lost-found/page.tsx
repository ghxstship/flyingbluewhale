import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Lost & Found -- ${slug} -- GVTEWAY` }; 
}

export default async function PortalLostFoundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: reports } = await supabase.from('lost_found_reports').select(`*`).order('created_at', { ascending: false }).limit(50);

  const categoryIcons: Record<string, string> = {
    radio: '📻', credential: '🎫', equipment: '🔧', personal_item: '👝', clothing: '👕', electronics: '📱', wallet_keys: '🔑', other: '📦',
  };

  const foundItems = (reports ?? []).filter(r => r.type === 'found' && !['returned','shipped','disposed'].includes(r.status));

  return (
    <>
      <ModuleHeader
        title="Lost & Found"
        subtitle={`${foundItems.length} items awaiting claim · Report or browse found items`}
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="6xl"
      >
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="border border-border">Report Lost</Button>
          <Button variant="primary" size="sm">Report Found</Button>
        </div>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {(reports?.length ?? 0) === 0 ? (
          <EmptyState title="No lost & found reports for this project" />
        ) : (
          <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1rem">
            {reports?.map((r) => {
              const icon = categoryIcons[r.category] || '📦';
              return (
                <div key={r.id} className="card p-5 cursor-pointer hover:border-cyan/50 transition-colors" style={{ borderTop: `3px solid ${r.type === 'lost' ? '#EF4444' : '#22C55E'}` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="font-mono text-[0.5rem] text-text-disabled">{r.reference_number}</span>
                  </div>
                  <p className="text-sm text-text-primary mb-2 line-clamp-2">{r.item_description}</p>
                  
                  <div className="flex gap-2 flex-wrap text-xs text-text-tertiary">
                    {r.found_location_id && <span className="badge border border-border bg-surface-raised">Loc ID: {r.found_location_id}</span>}
                    {r.item_color && <span className="badge border border-border bg-surface-raised">🎨 {r.item_color}</span>}
                    {r.item_brand && <span className="badge border border-border bg-surface-raised font-mono">{r.item_brand}</span>}
                    <span className="text-text-disabled text-[0.625rem] self-center ml-auto">
                      {r.found_at ? new Date(r.found_at).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {r.status === 'cataloged' && (
                    <Button variant="secondary" size="sm" className="w-full mt-4 font-heading tracking-wider uppercase text-[0.6875rem]">
                      Claim This Item
                    </Button>
                  )}
                </div>
              );
            })}
          </ContentGrid>
        )}
      </div>
    </>
  );
}
