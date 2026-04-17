import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function AutomationsPage() {
  return (
    <>
      <ModuleHeader eyebrow="AI" title="Automations" subtitle="Rule-based triggers powered by workspace events" />
      <div className="page-content">
        <EmptyState
          title="No automations yet"
          description="Create rules that listen for events (invoice.paid, deliverable.submitted) and run actions (send Slack, create task, draft message)."
          action={<Button href="/console/ai/automations/new">Create automation</Button>}
        />
      </div>
    </>
  );
}
