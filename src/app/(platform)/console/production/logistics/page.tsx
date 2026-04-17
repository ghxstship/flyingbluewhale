import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function LogisticsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Logistics" subtitle="Trucking, shipping, and on-site flow" />
      <div className="page-content">
        <EmptyState
          title="Move orders + shipments"
          description="Generate move orders from confirmed rentals + events. Live tracking and proof-of-delivery arrive in the next phase."
          action={<Button href="/console/production/rentals">Open rentals →</Button>}
        />
      </div>
    </>
  );
}
