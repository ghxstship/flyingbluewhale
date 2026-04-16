export const metadata = {
  title: 'Audit Log -- GVTEWAY',
  description: 'System audit trail for all platform actions.',
};

export default function AuditLogPage() {
  const auditTypes = [
    'project.created', 'project.updated', 'project.archived',
    'member.added', 'member.removed', 'member.role_changed',
    'deliverable.submitted', 'deliverable.approved', 'deliverable.rejected',
    'allocation.reserved', 'allocation.confirmed', 'allocation.returned',
    'cms.published', 'cms.reverted',
    'notification.sent', 'notification.failed',
    'credential.issued', 'credential.revoked',
    'catering.checked_in',
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Audit Log</h1>
            <p className="text-sm text-text-secondary mt-1">System-wide event trail</p>
          </div>
          <div className="flex gap-2">
            <input type="search" className="input text-xs py-1.5 w-48" placeholder="Search events..." />
            <button className="btn btn-ghost text-xs py-1.5 border border-border">Export</button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="card p-12 text-center">
            <p className="text-text-tertiary text-sm mb-4">Audit log will populate as platform activity occurs</p>
            <div className="flex flex-wrap justify-center gap-2">
              {auditTypes.map((type) => (
                <span key={type} className="text-mono text-[0.625rem] text-text-disabled px-2 py-1 bg-surface-raised rounded border border-border-subtle">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
