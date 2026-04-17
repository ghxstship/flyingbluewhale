import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Deliverables -- GVTEWAY',
  description: 'Track all deliverables across projects.',
};

type DeliverableRow = {
  id: string;
  type: string;
  status: string;
  version: number;
  updated_at: string;
  projects: { name: string; slug: string } | null;
  acts: { name: string; artist_name: string } | null;
};

const DELIVERABLE_COLUMNS: DataTableColumn<DeliverableRow>[] = [
  {
    key: 'type',
    header: 'Type',
    render: (d) => (
      <span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">
        {d.type.replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    key: 'project',
    header: 'Project',
    render: (d) => <span className="text-text-primary">{d.projects?.name || '-'}</span>,
  },
  {
    key: 'artist',
    header: 'Artist / Act',
    render: (d) => (
      <span className="text-text-secondary">
        {d.acts?.artist_name || d.acts?.name || '-'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (d) => <StatusBadge status={d.status} />,
  },
  {
    key: 'version',
    header: 'Version',
    render: (d) => <span className="text-mono text-text-tertiary text-xs">v{d.version}</span>,
  },
  {
    key: 'updated',
    header: 'Updated',
    render: (d) => (
      <span className="text-text-tertiary text-xs">
        {new Date(d.updated_at).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (d) => (
      <Button variant="ghost" size="sm" href={`/console/deliverables/${d.id}`}>
        Review
      </Button>
    ),
  },
];

export default async function DeliverablesPage() {
  const supabase = await createClient();

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select(`
      *,
      projects (name, slug),
      acts (name, artist_name)
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  const typedDeliverables = (deliverables ?? []) as DeliverableRow[];

  return (
    <>
      <ModuleHeader
        title="Deliverables"
        subtitle={`${typedDeliverables.length} deliverables across all projects`}
        maxWidth="6xl"
      >
        <select className="input text-xs py-1.5 h-[30px]">
          <option>All Types</option>
          <option>Technical Rider</option>
          <option>Hospitality Rider</option>
          <option>Input List</option>
          <option>Stage Plot</option>
          <option>Crew List</option>
          <option>Guest List</option>
          <option>Equipment Pull List</option>
          <option>Power Plan</option>
          <option>Rigging Plan</option>
          <option>Site Plan</option>
          <option>Build Schedule</option>
          <option>Vendor Package</option>
          <option>Safety Compliance</option>
          <option>Comms Plan</option>
          <option>Signage Grid</option>
        </select>
        <select className="input text-xs py-1.5 h-[30px]">
          <option>All Statuses</option>
          <option>Draft</option>
          <option>Submitted</option>
          <option>In Review</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        <DataTable
          columns={DELIVERABLE_COLUMNS}
          data={typedDeliverables}
          emptyText="No deliverables yet"
        />
      </div>
    </>
  );
}
