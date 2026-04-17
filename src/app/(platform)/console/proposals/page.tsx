import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ProposalsPage() {
  return (
    <>
      <ModuleHeader 
        title="Proposals & Quoting Builder" 
        subtitle="Build estimates, compile scopes of work, and finalize client contracts." 
      />
      <div className="p-6">
        <Card className="p-8 border-dashed border-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-cyan-subtle rounded-full flex items-center justify-center text-cyan mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <h3 className="text-lg font-heading text-text-primary mb-2">Create New Proposal</h3>
          <p className="text-sm text-text-tertiary max-w-md mb-6">
            Launch the intelligent quoting wizard to rapidly assemble venue specs, team workloads, and phase estimation structures.
          </p>
          <Button variant="primary">Launch Builder Wizard</Button>
        </Card>
      </div>
    </>
  );
}
