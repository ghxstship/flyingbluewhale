import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AgentsPage() {
  return (
    <>
      <ModuleHeader eyebrow="AI" title="Agents" subtitle="Long-running managed agents for advancing + production" />
      <div className="page-content">
        <EmptyState
          title="Managed Agents in beta"
          description="Spin up persistent agents with their own containers to reconcile invoices, draft advancing responses, or triage incoming tickets. Contact sales to enable."
        />
      </div>
    </>
  );
}
