import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function FormsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Collaboration" title="Forms" subtitle="Public and private intake forms" />
      <div className="page-content">
        <EmptyState
          title="Build your first intake form"
          description="Capture new leads, vendor applications, or incident reports — results post directly into your workspace."
          action={<Button href="/console/forms/new">Create form</Button>}
        />
      </div>
    </>
  );
}
