import { createClient } from '@/lib/supabase/server';

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
      catering_allocations (id, quantity, status, dietary_requirements)
    `)
    .order('date')
    .order('time');

  const dietaryOptions = ['vegan', 'vegetarian', 'gluten_free', 'halal', 'kosher', 'allergen_free'];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Catering</h1>
            <p className="text-sm text-text-secondary mt-1">
              {mealPlans?.length ?? 0} meal plans
            </p>
          </div>
          <button className="btn btn-primary text-xs py-2 px-4">New Meal Plan</button>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Covers" value={mealPlans?.reduce((acc, mp) => acc + (mp.capacity || 0), 0) ?? 0} />
            <StatCard label="Confirmed" value={mealPlans?.reduce((acc, mp) => acc + ((mp.catering_allocations ?? []) as { status: string }[]).filter((a) => a.status === 'confirmed').length, 0) ?? 0} accent />
            <StatCard label="Checked In" value={mealPlans?.reduce((acc, mp) => acc + ((mp.catering_allocations ?? []) as { status: string }[]).filter((a) => a.status === 'checked_in').length, 0) ?? 0} />
            <StatCard label="Cost Per Person" value="$189" prefix />
          </div>

          {/* Meal Plans */}
          {(mealPlans?.length ?? 0) === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-text-tertiary text-sm mb-4">No meal plans yet</p>
              <p className="text-text-disabled text-xs max-w-md mx-auto mb-6">
                Create meal plans with dietary tracking, group allocations, and on-site check-in.
              </p>
              <button className="btn btn-primary text-xs py-2 px-6">Create Meal Plan</button>
            </div>
          ) : (
            <div className="space-y-4">
              {mealPlans?.map((mp) => {
                const allocations = (mp.catering_allocations ?? []) as { id: string; quantity: number; status: string; dietary_requirements: Record<string, unknown> }[];
                const totalAllocated = allocations.reduce((acc, a) => acc + a.quantity, 0);
                const checked = allocations.filter((a) => a.status === 'checked_in').length;
                const utilization = mp.capacity ? Math.round((totalAllocated / mp.capacity) * 100) : 0;

                return (
                  <div key={mp.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-heading text-sm text-text-primary">{mp.meal_name}</h3>
                        <p className="text-xs text-text-tertiary mt-1">
                          {mp.date} &middot; {mp.time} &middot; {mp.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-display text-xl text-cyan">{totalAllocated}/{mp.capacity}</div>
                        <div className="text-label text-text-disabled text-[0.5rem]">Allocated</div>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    <div className="w-full h-1.5 bg-surface-raised rounded-full mb-4 overflow-hidden">
                      <div className="h-full bg-cyan rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>

                    {/* Dietary badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dietaryOptions.map((opt) => (
                        <span key={opt} className={`px-2 py-0.5 rounded text-[0.5rem] border ${(mp.dietary_options as Record<string, boolean>)?.[opt] ? 'text-approved border-approved/30 bg-approved/10' : 'text-text-disabled border-border bg-surface-raised'}`} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {opt.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>{allocations.length} group allocations</span>
                      <span>{checked} checked in</span>
                      {mp.cost_per_person && <span className="text-cyan">${Number(mp.cost_per_person).toFixed(2)}/person</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, prefix }: { label: string; value: number | string; accent?: boolean; prefix?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-label text-text-tertiary mb-2">{label}</div>
      <div className={`text-display text-3xl ${accent ? 'text-cyan' : 'text-text-primary'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
