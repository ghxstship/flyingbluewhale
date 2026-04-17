import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function IncidentNew() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-error)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Incident report</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Log a safety issue — admin and EHS lead are notified immediately.</p>
      <div className="mt-6">
        <EmptyState
          title="Report a safety incident"
          description="Add photos, GPS, and witness statements. In emergencies always call local services first."
          action={<Button variant="danger">Start report</Button>}
        />
      </div>
    </div>
  );
}
