import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { AlertBanner } from '@/components/modules/AlertBanner';
import { ScheduleTimeline, type TimelineGroup } from '@/components/modules/ScheduleTimeline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Logistics Schedules -- GVTEWAY' };

type ScheduleRow = {
  id: string;
  reference_number: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduled_window_start: string | null;
  scheduled_window_end: string | null;
  dock_assignment: string | null;
  item_summary: string | null;
  assigned_to: string | null;
};

const TYPE_ICONS: Record<string, string> = {
  pickup: '📦',
  delivery: '🚚',
  transfer: '🔄',
  vendor_return: '↩️',
  will_call: '🎫',
};

const TYPE_COLORS: Record<string, string> = {
  pickup: '#EAB308',
  delivery: '#22C55E',
  transfer: '#A855F7',
  vendor_return: '#EF4444',
  will_call: '#3B82F6',
};

export default async function SchedulesPage() {
  const supabase = await createClient();
  const { data: schedules } = await supabase
    .from('logistics_schedules')
    .select('*')
    .order('scheduled_window_start', { ascending: true })
    .limit(100);

  const items = (schedules ?? []) as ScheduleRow[];
  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = items.filter(s => s.scheduled_window_start?.startsWith(today));
  const upcoming = items.filter(s => !['completed', 'cancelled'].includes(s.status));
  const urgentItems = items.filter(s => s.priority === 'urgent' && !['completed', 'cancelled'].includes(s.status));

  /* Group by date */
  const byDate = items.reduce((acc, s) => {
    const date = s.scheduled_window_start
      ? new Date(s.scheduled_window_start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'Unscheduled';
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {} as Record<string, ScheduleRow[]>);

  const groups: TimelineGroup<ScheduleRow>[] = Object.entries(byDate).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));

  return (
    <>
      <ModuleHeader
        title="Logistics Schedules"
        subtitle={`${todaySchedules.length} today · ${upcoming.length} upcoming${urgentItems.length > 0 ? ` · ${urgentItems.length} urgent` : ''}`}
      >
        <Button variant="primary" size="sm">New Schedule</Button>
      </ModuleHeader>
      <div className="page-content">
        {urgentItems.length > 0 && (
          <AlertBanner variant="error" title="🚨 Urgent Schedules">
            {urgentItems.map(s => (
              <Badge key={s.id} variant="error">
                {s.reference_number} · {s.title}
              </Badge>
            ))}
          </AlertBanner>
        )}

        <ScheduleTimeline
          groups={groups}
          itemKey={(s) => s.id}
          emptyText="No schedules"
          emptyDescription="Schedule pickups, deliveries, transfers, and vendor returns"
          renderItem={(s) => {
            const typeColor = TYPE_COLORS[s.type] || TYPE_COLORS.delivery;
            const icon = TYPE_ICONS[s.type] || '🚚';
            const start = s.scheduled_window_start
              ? new Date(s.scheduled_window_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '';
            const end = s.scheduled_window_end
              ? new Date(s.scheduled_window_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                className="card p-4 flex items-center gap-4 cursor-pointer"
                style={{ borderLeft: `3px solid ${typeColor}` }}
              >
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mono text-[0.5625rem] text-cyan">{s.reference_number}</span>
                    <StatusBadge status={s.status} />
                    {s.priority !== 'normal' && <StatusBadge status={s.priority} />}
                  </div>
                  <div className="text-text-primary text-[0.8125rem]">{s.title}</div>
                  {s.item_summary && (
                    <div className="text-[0.625rem] text-text-disabled mt-0.5">{s.item_summary}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-mono text-[0.6875rem] text-text-secondary">{start}</div>
                  {end && <div className="text-[0.5rem] text-text-disabled">to {end}</div>}
                  {s.dock_assignment && (
                    <div className="text-[0.5625rem] text-text-tertiary mt-1">Dock: {s.dock_assignment}</div>
                  )}
                </div>
                {s.assigned_to && (
                  <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-[0.5rem] text-text-tertiary">
                    👤
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
