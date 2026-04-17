import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function TemplatesPage() {
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="Proposal templates" subtitle="Reusable proposal templates for common engagements" />
      <div className="page-content">
        <EmptyState
          title="Spin up a template library"
          description="Standard festival production, brand activation, and touring packages keep your team fast and consistent."
          action={<Button href="/console/proposals/new">Draft from scratch</Button>}
        />
      </div>
    </>
  );
}
