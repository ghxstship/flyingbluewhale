import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { StatCard } from '@/components/data/StatCard';
import { EmptyState } from '@/components/data/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Catering -- GVTEWAY',
  description: 'Meal plan management, dietary tracking, and cost reporting.',
};

export default async function CateringPage() {
  const supabase = await createClient();

  const { data: mealPlans } = await supabase
    .from('catering_meal_plans')
    .select(`
      *,
      catering_allocations (id, quantity, status, dietary_requirements),
      locations (id, name, type)
    `)
    .order('date')
    .order('time');

  const dietaryOptions = ['vegan', 'vegetarian', 'gluten_free', 'halal', 'kosher', 'allergen_free'];

  return (
    <>
      <ModuleHeader
        title="Catering"
        subtitle={`${mealPlans?.length ?? 0} meal plans`}
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">New Meal Plan</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {/* Stats */}
        <ContentGrid columns={{ sm: 1, md: 4 }} className="mb-8">
          <StatCard label="Total Covers" value={mealPlans?.reduce((acc, mp) => acc + (mp.capacity || 0), 0) ?? 0} />
          <StatCard label="Confirmed" value={mealPlans?.reduce((acc, mp) => acc + ((mp.catering_allocations ?? []) as { status: string }[]).filter((a) => a.status === 'confirmed').length, 0) ?? 0} accent />
          <StatCard label="Checked In" value={mealPlans?.reduce((acc, mp) => acc + ((mp.catering_allocations ?? []) as { status: string }[]).filter((a) => a.status === 'checked_in').length, 0) ?? 0} />
          <StatCard label="Cost Per Person" value="$189" />
        </ContentGrid>

        {/* Meal Plans */}
        {(mealPlans?.length ?? 0) === 0 ? (
          <EmptyState 
            title="No meal plans yet" 
            description="Create meal plans with dietary tracking, group allocations, and on-site check-in."
            actionLabel="Create Meal Plan"
            actionHref="#"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {mealPlans?.map((mp) => {
              const allocations = (mp.catering_allocations ?? []) as { id: string; quantity: number; status: string; dietary_requirements: Record<string, unknown> }[];
              const totalAllocated = allocations.reduce((acc, a) => acc + a.quantity, 0);
              const checked = allocations.filter((a) => a.status === 'checked_in').length;
              const utilization = mp.capacity ? Math.round((totalAllocated / mp.capacity) * 100) : 0;

              return (
                <div key={mp.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-heading text-sm text-text-primary">{mp.meal_name}</h3>
                      <p className="text-xs text-text-tertiary mt-1">
                        {mp.date} &middot; {mp.time} &middot; {(mp as any).locations ? `📍 ${((mp as any).locations as { name: string }).name}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl text-cyan">{totalAllocated}/{mp.capacity}</div>
                      <div className="text-[0.5rem] tracking-wider uppercase text-text-disabled">Allocated</div>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <ProgressBar value={utilization} className="mb-4" />

                  {/* Dietary badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {dietaryOptions.map((opt) => {
                      const isActive = (mp.dietary_options as Record<string, boolean>)?.[opt];
                      return (
                        <div 
                          key={opt} 
                          className={`badge text-[0.5rem] tracking-wider uppercase ${isActive ? 'bg-[rgba(34,197,94,0.12)] text-[#22C55E]' : 'bg-surface-raised text-text-disabled border border-border'}`}
                        >
                          {opt.replace(/_/g, ' ')}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>{allocations.length} group allocations</span>
                    <span>{checked} checked in</span>
                    {mp.cost_per_person && <span className="text-cyan font-mono">${Number(mp.cost_per_person).toFixed(2)}/person</span>}
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
