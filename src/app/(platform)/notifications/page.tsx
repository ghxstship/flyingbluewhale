import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Notifications -- GVTEWAY',
  description: 'Manage notification templates and delivery logs.',
};

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Notifications</h1>
            <p className="text-sm text-text-secondary mt-1">
              {templates?.length ?? 0} templates &middot; {logs?.length ?? 0} deliveries
            </p>
          </div>
          <button className="btn btn-primary text-xs py-2 px-4">New Template</button>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Templates */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Notification Templates</h2>
            </div>

            {(templates?.length ?? 0) === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-text-tertiary text-sm mb-2">No notification templates yet</p>
                <p className="text-text-disabled text-xs mb-6">
                  Create email or SMS templates that trigger on platform events.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {triggerEvents.map((e) => (
                    <span key={e} className="px-2.5 py-1 rounded text-[0.625rem] text-text-secondary bg-surface-raised border border-border-subtle" style={{ fontFamily: 'var(--font-mono)' }}>
                      {e}
                    </span>
                  ))}
                </div>
                <button className="btn btn-primary text-xs py-2 px-6">Create Template</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((tpl) => (
                  <div key={tpl.id} className="card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge border ${tpl.channel === 'email' ? 'text-info border-info/30 bg-info/10' : 'text-success border-success/30 bg-success/10'}`}>
                        {tpl.channel}
                      </span>
                      {tpl.is_active && <span className="badge border text-approved border-approved/30 bg-approved/10">Active</span>}
                    </div>
                    <h3 className="text-sm text-text-primary mb-1">{tpl.name}</h3>
                    {tpl.subject && <p className="text-xs text-text-tertiary mb-2">Subject: {tpl.subject}</p>}
                    {tpl.trigger_event && (
                      <span className="text-mono text-[0.625rem] text-text-disabled">{tpl.trigger_event}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Delivery Log */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Delivery Log</h2>
            </div>

            {(logs?.length ?? 0) === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-text-tertiary text-sm">No notifications sent yet</p>
                <p className="text-text-disabled text-xs mt-1">Delivery log will populate as notifications are triggered</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id}>
                      <td><span className="badge border text-info border-info/30 bg-info/10">{log.channel}</span></td>
                      <td className="text-text-secondary text-xs">{log.recipient_email || log.recipient_phone}</td>
                      <td className="text-text-primary">{log.subject || '-'}</td>
                      <td>
                        <span className={`badge border ${log.delivery_status === 'delivered' ? 'text-approved border-approved/30 bg-approved/10' : 'text-draft border-draft/30 bg-draft/10'}`}>
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="text-text-tertiary text-xs">{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
