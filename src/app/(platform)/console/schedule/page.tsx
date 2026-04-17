import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { ScheduleTimeline, type TimelineGroup } from '@/components/modules/ScheduleTimeline';

export const metadata = { title: 'Master Schedule — GVTEWAY' };

type MasterScheduleEntry = {
  id: string;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  category: string;
  icon: string | null;
  status: string | null;
  priority: string | null;
  project_name: string | null;
  location_name: string | null;
  space_name: string | null;
  assignee_name: string | null;
  is_recurring: boolean;
  is_cancelled: boolean;
  rrule: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  show: '#EC4899', // pink
  production: '#3B82F6', // blue
  logistics: '#22C55E', // green
  catering: '#FBBF24', // amber
  deadline: '#EF4444', // red
  credential: '#8B5CF6', // purple
  ticketing: '#14B8A6', // teal
  meeting: '#6366F1', // indigo
  inspection: '#F97316', // orange
  milestone: '#06B6D4', // cyan
  shift: '#A855F7', // fuchsia
  hours_of_operation: '#64748B', // slate
};

export default async function MasterSchedulePage() {
  const supabase = await createClient();

  // Fetch projected schedule entries via the enriched view
  const { data: entries } = await supabase
    .from('v_master_schedule')
    .select('*')
    .eq('is_cancelled', false)
    .order('starts_at', { ascending: true })
    .limit(500);

  const items = (entries ?? []) as MasterScheduleEntry[];
  
  // Group by date for the timeline
  const byDate = items.reduce((acc, s) => {
    const date = new Date(s.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {} as Record<string, MasterScheduleEntry[]>);

  const groups: TimelineGroup<MasterScheduleEntry>[] = Object.entries(byDate).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));

  const today = new Date().toISOString().split('T')[0];
  const todayCount = items.filter(s => s.starts_at.startsWith(today)).length;
  const upcomingCount = items.length;

  return (
    <>
      <ModuleHeader
        title="Master Schedule"
        subtitle={`${todayCount} today · ${upcomingCount} upcoming across all projects`}
      >
        <form action="/api/v1/master-schedule/export" method="GET" target="_blank" className="inline-block relative">
          <button type="submit" className="btn btn-secondary size-sm">
            📥 Export to Calendar (ICS)
          </button>
        </form>
      </ModuleHeader>

      <div className="page-content">
        <ScheduleTimeline
          groups={groups}
          itemKey={(s) => s.id}
          emptyText="No schedule entries"
          emptyDescription="The unified timeline is currently clear."
          renderItem={(s) => {
            const typeColor = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.logistics;
            const icon = s.icon || '📌';
            
            let timeString = '';
            if (s.all_day) {
              timeString = 'All Day';
            } else {
              const start = new Date(s.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const end = s.ends_at ? new Date(s.ends_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
              timeString = end ? `${start} to ${end}` : start;
            }

            return (
              <div
                className="card p-4 flex items-center gap-4 hover:border-cyan transition-colors"
                style={{ borderLeft: `3px solid ${typeColor}` }}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center text-2xl shrink-0">
                  {icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span 
                      className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-semibold tracking-wider uppercase"
                      style={{ background: `${typeColor}20`, color: typeColor }}
                    >
                      {s.category.replace(/_/g, ' ')}
                    </span>
                    {s.project_name && (
                      <span className="text-mono text-[0.625rem] text-text-tertiary truncate max-w-[150px]">
                        {s.project_name}
                      </span>
                    )}
                    {s.status && <StatusBadge status={s.status} />}
                    {s.priority && s.priority !== 'normal' && <StatusBadge status={s.priority} />}
                    {s.is_recurring && (
                      <span className="text-mono text-[0.625rem] text-cyan">🔄 RECURRING</span>
                    )}
                  </div>
                  
                  <div className="text-text-primary text-sm font-semibold truncate">
                    {s.title}
                  </div>
                  
                  {s.subtitle && (
                    <div className="text-[0.6875rem] text-text-secondary mt-0.5 truncate">
                      {s.subtitle}
                    </div>
                  )}
                  {s.rrule && (
                    <div className="text-mono text-[0.625rem] text-text-tertiary mt-1 opacity-75 truncate">
                      {s.rrule.replace('FREQ=', '🔄 ')}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-mono text-[0.75rem] text-text-primary font-medium">{timeString}</div>
                  {(s.location_name || s.space_name) && (
                    <div className="text-[0.625rem] text-text-secondary mt-1 max-w-[120px] truncate ml-auto">
                      📍 {[s.location_name, s.space_name].filter(Boolean).join(' - ')}
                    </div>
                  )}
                </div>
                
                {s.assignee_name && (
                  <div 
                    className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border"
                    title={s.assignee_name}
                  >
                    <span className="text-[0.6875rem] text-text-secondary">
                      {s.assignee_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    </>
  );
}
