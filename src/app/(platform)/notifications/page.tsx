import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { EmptyState } from '@/components/data/EmptyState';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Notifications -- GVTEWAY',
  description: 'Manage notification templates and delivery logs.',
};

type LogRow = {
  id: string;
  channel: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  delivery_status: string;
  sent_at: string;
};

const LOG_COLUMNS: DataTableColumn<LogRow>[] = [
  {
    key: 'channel',
    header: 'Channel',
    render: (l) => <Badge variant="info">{l.channel}</Badge>,
  },
  {
    key: 'recipient',
    header: 'Recipient',
    render: (l) => <span className="text-text-secondary text-xs">{l.recipient_email || l.recipient_phone}</span>,
  },
  {
    key: 'subject',
    header: 'Subject',
    render: (l) => <span className="text-text-primary">{l.subject || '-'}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (l) => (
      <Badge variant={l.delivery_status === 'delivered' ? 'success' : 'muted'}>
        {l.delivery_status}
      </Badge>
    ),
  },
  {
    key: 'sent',
    header: 'Sent',
    render: (l) => <span className="text-text-tertiary text-xs">{new Date(l.sent_at).toLocaleString()}</span>,
  },
];

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('notification_templates')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: logs } = await supabase
    .from('notification_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50);

  const typedLogs = (logs ?? []) as LogRow[];
  const triggerEvents = [
    'deliverable.submitted', 'deliverable.approved', 'deliverable.rejected',
    'deliverable.revision_requested', 'deliverable.deadline_approaching',
    'project.member_added', 'project.status_changed',
    'guest_list.submitted', 'guest_list.approved',
    'credential.issued', 'credential.pickup_ready',
    'catering.meal_reminder', 'catering.dietary_update',
    'custom',
  ];

  return (
    <>
      <ModuleHeader
        title="Notifications"
        subtitle={`${templates?.length ?? 0} templates · ${typedLogs.length} deliveries`}
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">New Template</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {/* Templates */}
        <section className="mb-12">
          <SectionHeading>Notification Templates</SectionHeading>

          {(templates?.length ?? 0) === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-text-tertiary text-sm mb-2">No notification templates yet</p>
              <p className="text-text-disabled text-xs mb-6">Create email or SMS templates that trigger on platform events.</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {triggerEvents.map((e) => (
                  <span key={e} className="px-2.5 py-1 rounded text-[0.625rem] text-text-secondary bg-surface-raised border border-border-subtle font-mono">
                    {e}
                  </span>
                ))}
              </div>
              <Button variant="primary" size="sm">Create Template</Button>
            </div>
          ) : (
            <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1rem">
              {templates?.map((tpl) => (
                <div key={tpl.id} className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={tpl.channel === 'email' ? 'info' : 'success'}>
                      {tpl.channel}
                    </Badge>
                    {tpl.is_active && <Badge variant="success">Active</Badge>}
                  </div>
                  <h3 className="text-sm text-text-primary mb-1">{tpl.name}</h3>
                  {tpl.subject && <p className="text-xs text-text-tertiary mb-2">Subject: {tpl.subject}</p>}
                  {tpl.trigger_event && (
                    <span className="font-mono text-[0.625rem] text-text-disabled">{tpl.trigger_event}</span>
                  )}
                </div>
              ))}
            </ContentGrid>
          )}
        </section>

        {/* Delivery Log */}
        <section>
          <SectionHeading>Delivery Log</SectionHeading>

          {typedLogs.length === 0 ? (
            <EmptyState 
              title="No notifications sent yet" 
              description="Delivery log will populate as notifications are triggered"
            />
          ) : (
            <DataTable
              columns={LOG_COLUMNS}
              data={typedLogs}
              emptyText="No delivery logs"
            />
          )}
        </section>
      </div>
    </>
  );
}
