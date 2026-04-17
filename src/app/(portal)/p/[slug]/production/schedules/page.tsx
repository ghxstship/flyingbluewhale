import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Schedules -- ${slug} -- GVTEWAY` }; 
}

type ScheduleRow = {
  id: string;
  type: string;
  reference_number: string;
  status: string;
  title: string;
  item_summary: string | null;
  scheduled_window_start: string | null;
};

const typeColors: Record<string, { icon: string; fg: string }> = {
  pickup: { icon: '📦', fg: '#EAB308' },
  delivery: { icon: '🚚', fg: '#22C55E' },
  transfer: { icon: '🔄', fg: '#A855F7' },
  vendor_return: { icon: '↩️', fg: '#EF4444' },
  will_call: { icon: '🎫', fg: '#3B82F6' },
};

const SCHEDULES_COLUMNS: DataTableColumn<ScheduleRow>[] = [
  {
    key: 'type',
    header: '',
    render: (s) => (
      <span className="text-xl" style={{ color: typeColors[s.type]?.fg || '#22C55E' }}>
        {typeColors[s.type]?.icon || '📅'}
      </span>
    ),
  },
  {
    key: 'ref',
    header: 'Ref #',
    render: (s) => <span className="font-mono text-[0.5625rem] text-cyan">{s.reference_number}</span>,
  },
  {
    key: 'details',
    header: 'Details',
    render: (s) => (
      <div>
        <div className="text-sm text-text-primary">{s.title}</div>
        {s.item_summary && <div className="text-xs text-text-disabled mt-0.5 truncate max-w-sm">{s.item_summary}</div>}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: 'time',
    header: 'Time',
    align: 'right',
    render: (s) => {
      const start = s.scheduled_window_start ? new Date(s.scheduled_window_start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
      return <span className="text-xs text-text-tertiary">{start}</span>;
    },
  },
];

export default async function PortalSchedulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: schedules } = await supabase
    .from('logistics_schedules')
    .select(`*`)
    .order('scheduled_window_start', { ascending: true })
    .limit(50);

  const typedSchedules = (schedules ?? []) as ScheduleRow[];
  const active = typedSchedules.filter(s => !['completed','cancelled'].includes(s.status));

  return (
    <>
      <ModuleHeader
        title="Schedules"
        subtitle={`${active.length} active pickups, deliveries & transfers`}
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">Request Pickup</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {typedSchedules.length === 0 ? (
          <EmptyState title="No schedules" />
        ) : (
          <DataTable
            columns={SCHEDULES_COLUMNS}
            data={typedSchedules}
            emptyText="No schedules"
            rowClassName={(s) => `cursor-pointer hover:border-cyan border-l-[3px]`}
          />
        )}
      </div>
    </>
  );
}
