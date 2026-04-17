import { ModuleHeader } from '@/components/layout/ModuleHeader';

export default function LeadsPage() {
  return (
    <>
      <ModuleHeader title="Leads" subtitle="Module incoming from Red Sea Lion ERP migration." />
      <div className="p-6">
        <div className="card p-8 border-dashed border-border flex items-center justify-center text-text-tertiary">
          This module is currently being ported to the ATLVS unified command center.
        </div>
      </div>
    </>
  );
}
