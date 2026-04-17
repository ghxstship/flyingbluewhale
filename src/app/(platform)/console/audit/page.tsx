import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    <>
      <ModuleHeader
        title="Audit Log"
        subtitle="System-wide event trail"
        maxWidth="6xl"
      >
        <Input 
          type="search" 
          placeholder="Search events..." 
          className="text-xs py-1.5 w-48 h-[30px]" 
        />
        <Button variant="ghost" size="sm" className="border border-border">
          Export
        </Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        <div className="card p-12 text-center">
          <p className="text-text-tertiary text-sm mb-4">
            Audit log will populate as platform activity occurs
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {auditTypes.map((type) => (
              <span 
                key={type} 
                className="text-mono text-[0.625rem] text-text-disabled px-2 py-1 bg-surface-raised rounded border border-border-subtle"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
