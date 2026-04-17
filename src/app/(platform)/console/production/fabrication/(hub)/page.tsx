import { ModuleHeader } from '@/components/layout/ModuleHeader';

export default function FabricationPage() {
  return (
    <>
      <ModuleHeader title="Fabrication" subtitle="Module incoming from Red Sea Lion ERP migration." />
      <div className="p-6">
        <div className="card p-8 border-dashed border-border flex items-center justify-center text-text-tertiary">
          This module is currently being ported to the ATLVS unified command center.
        </div>
      </div>
    </>
  );
}
