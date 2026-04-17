import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function DispatchPage() {
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Dispatch" subtitle="Route crew and gear across live jobs" />
      <div className="page-content">
        <EmptyState
          title="Dispatch board live-view coming"
          description="Real-time crew + vehicle dispatch rides on top of the events and rentals schema. Seed some projects and rentals to populate this view."
          action={<Button href="/console/schedule">Open schedule →</Button>}
        />
      </div>
    </>
  );
}
