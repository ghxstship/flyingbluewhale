import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LOCATION_TYPE_ICONS, LOCATION_TYPE_LABELS, type LocationType } from '@/lib/supabase/types';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Locations — GVTEWAY' };

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from('locations')
    .select(`*`)
    .order('name');

  const topLevel = (locations ?? []).filter((l) => !l.parent_id);
  const childrenOf = (parentId: string) => (locations ?? []).filter((l) => l.parent_id === parentId);
  const total = locations?.length ?? 0;
  const active = (locations ?? []).filter((l) => l.is_active).length;

  const typeStats = (locations ?? []).reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeColors: Record<string, string> = {
    warehouse: '#3B82F6',
    site: '#22C55E',
    dock: '#A855F7',
    stage: '#00E5FF',
    storage: '#EAB308',
    vehicle: '#EF4444',
    vendor: '#9CA3AF',
    venue: '#EC4899',
    office: '#6366F1',
    room: '#14B8A6',
    gate: '#F59E0B',
    zone: '#D946EF',
    loading_bay: '#FB923C',
    parking: '#6B7280',
    green_room: '#4ADE80',
    production_office: '#818CF8',
    kitchen: '#FBBF24',
    bar: '#F97316',
    dining: '#F472B6',
    performance: '#C084FC',
    backstage: '#22D3EE',
    other: '#9CA3AF',
  };

  return (
    <>
      <ModuleHeader
        title="Locations"
        subtitle={`${total} locations · ${active} active · Venues, warehouses, stages, rooms`}
      >
        <Button variant="primary" size="sm" href="/console/locations/new">
          + New Location
        </Button>
      </ModuleHeader>

      <div className="page-content">
        {/* Type Stats */}
        {Object.keys(typeStats).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.entries(typeStats).sort(([, a], [, b]) => b - a).map(([type, count]) => {
              const fg = typeColors[type] || typeColors.other;
              const bg = `rgba(${parseInt(fg.slice(1, 3), 16)},${parseInt(fg.slice(3, 5), 16)},${parseInt(fg.slice(5, 7), 16)},0.12)`;
              const icon = LOCATION_TYPE_ICONS[type as LocationType] || '📌';
              const label = LOCATION_TYPE_LABELS[type as LocationType] || type.replace(/_/g, ' ');
              return (
                <div key={type} className="card px-5 py-3 flex items-center gap-2 min-w-fit" style={{ borderColor: bg }}>
                  <span className="text-base">{icon}</span>
                  <div>
                    <div className="font-display text-lg leading-tight" style={{ color: fg }}>{count}</div>
                    <div className="text-[0.5625rem] text-text-tertiary tracking-wider uppercase">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Location List */}
        {total === 0 ? (
          <EmptyState 
            title="No locations configured" 
            description="Add your first venue, warehouse, or site to get started"
            icon={<span className="text-4xl text-cyan-subtle">🏟️</span>}
            actionLabel="Create Location"
            actionHref="/console/locations/new"
          />
        ) : (
           <div className="flex flex-col gap-3">
             {topLevel.map((loc) => {
               const fg = typeColors[loc.type] || typeColors.other;
               const bg = `rgba(${parseInt(fg.slice(1, 3), 16)},${parseInt(fg.slice(3, 5), 16)},${parseInt(fg.slice(5, 7), 16)},0.12)`;
               const icon = LOCATION_TYPE_ICONS[loc.type as LocationType] || '📌';
               const addr = loc.address as Record<string, string> | null;
               const cap = loc.capacity as Record<string, number> | null;
               const contact = loc.contact as Record<string, string> | null;
               const kids = childrenOf(loc.id);

               return (
                 <div key={loc.id} className="card overflow-hidden">
                   <Link href={`/console/locations/${loc.id}`} className="block p-5 hover:bg-surface-elevated transition-colors no-underline">
                     <div className="flex justify-between items-start">
                       <div className="flex gap-3 items-start">
                         <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: bg }}>
                           {icon}
                         </div>
                         <div>
                           <h3 className="font-heading text-sm text-text-primary mb-0.5">{loc.name}</h3>
                           {addr?.city && (
                             <p className="text-[0.6875rem] text-text-tertiary">
                               {addr.street && `${addr.street}, `}{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}
                             </p>
                           )}
                           <div className="flex gap-3 mt-1.5 flex-wrap">
                             {cap && Object.entries(cap).map(([k, v]) => (
                               <span key={k} className="text-[0.5625rem] text-text-disabled">
                                 <span className="font-mono text-text-secondary">{v}</span> {k}
                               </span>
                             ))}
                             {kids.length > 0 && (
                               <span className="text-[0.5625rem] text-cyan">
                                 {kids.length} sub-location{kids.length !== 1 ? 's' : ''}
                               </span>
                             )}
                             {contact?.name && (
                               <span className="text-[0.5625rem] text-text-disabled">👤 {contact.name}</span>
                             )}
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-2 shrink-0">
                         <span className="badge text-[0.5rem] tracking-wider uppercase" style={{ background: bg, color: fg }}>
                           {LOCATION_TYPE_LABELS[loc.type as LocationType] || loc.type.replace(/_/g, ' ')}
                         </span>
                         {!loc.is_active && (
                           <span className="badge text-[0.5rem] tracking-wider uppercase bg-[rgba(239,68,68,0.12)] text-[#EF4444]">
                             Inactive
                           </span>
                         )}
                       </div>
                     </div>
                   </Link>

                   {/* Children */}
                   {kids.length > 0 && (
                     <div className="border-t border-border-subtle bg-surface-raised">
                       {kids.map((child) => {
                         const cfg = typeColors[child.type] || typeColors.other;
                         const cbg = `rgba(${parseInt(cfg.slice(1, 3), 16)},${parseInt(cfg.slice(3, 5), 16)},${parseInt(cfg.slice(5, 7), 16)},0.12)`;
                         const ci = LOCATION_TYPE_ICONS[child.type as LocationType] || '📌';
                         
                         return (
                           <Link key={child.id} href={`/console/locations/${child.id}`} className="flex items-center gap-2.5 py-2.5 px-5 pl-14 border-t border-border-subtle no-underline hover:bg-surface-elevated transition-colors">
                             <span className="text-sm">{ci}</span>
                             <span className="text-xs text-text-secondary font-heading">{child.name}</span>
                             <span className="badge text-[0.4375rem] tracking-wider uppercase ml-auto" style={{ background: cbg, color: cfg }}>
                               {LOCATION_TYPE_LABELS[child.type as LocationType] || child.type.replace(/_/g, ' ')}
                             </span>
                             {!child.is_active && <span className="text-[0.4375rem] text-[#EF4444]">●</span>}
                           </Link>
                         );
                       })}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        )}
      </div>
    </>
  );
}
